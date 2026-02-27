import { Request, Response } from "express"
import { get } from "lodash";
import * as response from "../responses"
import { createTransaction, findAndUpdateTransaction, findTransaction, findTransactions } from "../service/transaction.service"
import { addDays, calculateFee, calculateTransferFee, generateCode } from "../utils/utils";
import config from 'config';
import { findUser } from "../service/user.service";
import { createOrder, findAndUpdateOrder, findOrder } from "../service/order.service";
import { initiateTransaction, NewTransactionInput, verifyTransaction } from "../service/integrations/paystack.service";
import { OrderDocument } from "../model/order.model";
import { findBusiness } from "../service/business.service";
import websocketService from "../service/websocket.service";
import { createCustomer, findCustomer } from "../service/customer.service";
import { findBusinessSetting } from "../service/business-setting.service";
import { sendTransferJob } from "../queues/transfer.queue";
import moment from "moment";
import { findAndUpdateCart, findCart } from "../service/cart.service";
import { DocumentDefinition } from "mongoose";

export const receivePaymentHandler = async (req: Request, res: Response) => {
    try {
        const userId = get(req, 'user._id');
        // const invoiceCode = req.body.invoiceCode

        const user = await findUser({_id: userId})
        if(!user){
            return response.notFound(res, {message: 'user not found'})
        }
        let userType = ""
        if(user) {
            userType = user.userType
        }

        const order = await findOrder({_id: req.body.order})
        if(!order) {
            return response.notFound(res, {message: 'order not found'})
        }

        if(req.body.status === 'successful') {
            await findAndUpdateOrder({_id: order._id}, {paymentStatus: 'paid', status: 'completed'}, {new:true})
        }

        const transactionReference = generateCode(18, false)
        // const transactionProcessor = req.body.paymentChannel === 'ONLINE' ? 'FLUTTERWAVE' : 'CASHIER'

        // Create transacton first
        const newTransaction = await createTransaction({
            transactionReference,
            createdBy: userId,
            order: req.body.order,
            amount: req.body.amount || order.total, 
            processor: 'cashier',
            status: req.body.status,
            channel: req.body.channel,
            receivingChannel: req.body.receivingChannel,
            business: req.currentBusiness?._id
        })

        return response.created(res, newTransaction)

    } catch (error) {
        return response.error(res, error)
    }
}

export const initializePaymentHandler = async (req: Request, res: Response) => {
    try {
        const userId = get(req, 'user._id');
        // const invoiceCode = req.body.invoiceCode
        console.log('subdomain --->', req.businessSubdomain)
        const currentStore = await findBusiness({subdomain: req.businessSubdomain})
        if(!currentStore) {
            return response.notFound(res, {message: 'business not found'})
        }
        // const user = await findUser({_id: userId})
        // let userType = ""
        // if(user) {
        //     userType = user.userType
        // }

        // let order: OrderDocument | null = null // await findInvoice({invoiceCode}, 'user')
        // let subscriptionPlan: SubscriptionPlanDocument | null = null
        // if(!req.body.subscriptionPlan){
        let total = 0
        let orderTotal = 0

        if(req.body.order && req.body.order !== '') {
            const order = await findOrder({_id: req.body.order})
            
            if(!order) {
                return response.notFound(res, {message: "order not found"})
            }

            orderTotal = order.total
        }

        let cartSourceMenu = null

        if(req.body.cart && req.body.cart !== ''){
            const cart = await findCart({_id: req.body.cart}, 'table')
            
            if(!cart) {
                return response.notFound(res, {message: "cart not found"})
            }
            cartSourceMenu = cart.table.menu
            orderTotal = cart.total!
        }

        const transactionReference = generateCode(18, false)
        const transactionProcessor = req.body.paymentChannel === 'web' ? 'paystack' : 'cashier'
        const fees = calculateFee(orderTotal)
        total = orderTotal + fees

        // CREATE TRANSACTION FIRST
        const newTransaction = await createTransaction({
            transactionReference,
            createdBy: userId,
            order: req.body.order, //invoice._id,
            cart: req.body.cart, //invoice._id,
            amount: total,
            fees: fees,
            processor: transactionProcessor,
            channel: req.body.paymentChannel,
            business: currentStore._id,
            meta: {
                sourceMenu: cartSourceMenu
            }
        })

        const input: NewTransactionInput = {
            reference: newTransaction.transactionReference,
            amount: newTransaction.amount, //order!.amount,
            email: req.body.customer.email,
            firstName: req.body.customer.name.split(' ')[0],
            lastName: req.body.customer.name.split(' ')[1],
            phone: req.body.customer.phone,
            callbackUrl: req.body.callbackUrl
        }

        // find the business settings and add a split to the transaction input if the business prefers next day settlement
        const businessSettings = await findBusinessSetting({business: currentStore._id}, 'receivingAccounts.account')
        if (businessSettings && businessSettings.settlements?.preferred === 'next-working-day') {
            const transferAccount = businessSettings.receivingAccounts?.find(acc => acc.preferredForRemittance === true)
            if(!transferAccount) {
                return
            }

            input.subAccount = transferAccount.account.paystackRecipientCode
            input.mainAccountFunds = fees
            input.chargeBearer = 'subaccount'
        }


        const purchaseObject = await initiateTransaction(input) as { data: any }
        console.log('payment init data -> ', purchaseObject)
        return response.created(res, purchaseObject.data.data)

    } catch (error) {
        return response.error(res, error)
    }
}

export const verifyTransactionHandler = async (req: Request, res: Response) => {
    try {
        const currentStore = await findBusiness({subdomain: req.businessSubdomain})
        if(!currentStore) {
            return response.notFound(res, {message: 'business not found'})
        }
        
        const transactionReference = get(req, 'params.paystackReference');
        const input = {
            reference: transactionReference
        }
        const verification = await verifyTransaction(input)
        // console.log('---> ---> ', verification)
        
        if (verification.error) {
            return response.handleErrorResponse(res, verification)
        } else {
            const verificationData: any = verification.data.data
            const transaction = await findTransaction({transactionReference: verificationData.metadata.scanServeRef}, ['order','cart'])
            if(!transaction) {
                return response.notFound(res, {message: 'invoice transaction not found'})
            }

            if(transaction.processorData && transaction.processorData.id) {
                // transaction is already verified and processed, return from here
                return response.ok(res, {
                    verification: verificationData, 
                    order: transaction.order
                })
            }
            
            // create customer and append to order
            let customer = await findCustomer({
                business: currentStore._id,
                email: verificationData.customer.email
            })

            if(!customer) {
                customer = await createCustomer({
                    business: currentStore._id,
                    name: verificationData.metadata.first_name + ' ' + verificationData.metadata.last_name,
                    email: verificationData.customer.email,
                    phone: verificationData.metadata.customer_phone
                })
            }
                      
            // update the transaction
            const transactionStatus = verificationData.status

            const updateObject: any = {
                status: transactionStatus === 'success' ? 'successful' : transactionStatus,
                processorData: verificationData,
                processorTransactionId: verificationData.reference
            }


            let newOrder: DocumentDefinition<OrderDocument> | null = null

            // if there's a cart in the transaction - use the cart data to create the order
            if(transaction.cart) {
                // const cart = await findCart({_id: transaction.cart._id})

                await findAndUpdateCart({_id: transaction.cart._id}, {checkoutStatus: 'checked_out'}, {new: true})
                
                const orderRef = generateCode(12, true).toUpperCase()
                // create order pulling cart items and total price and set payment status to pending
                const orderPayload: any = {
                    alias: `web-order-${transaction.cart._id}`,
                    source: 'online',
                    items: transaction.cart.items,
                    total: transaction.amount,
                    status: 'pending',
                    paymentStatus: 'paid',
                    orderRef,
                    sourceMenu: transaction.meta!.sourceMenu,
                    business: transaction.business,
                    cart: transaction.cart._id,
                    table: transaction.cart.table,
                    // orderBy: body.orderBy,
                    // deliveryType: body.deliveryType,
                    // deliveryAddress: body.deliveryAddress,
                    paymentMethod: 'online',
                    customer: customer._id
                    // vat: orderTotal(cart.items, storeSettings).vat
                }

                newOrder = await createOrder(orderPayload)

                if(newOrder) {
                    updateObject.order = newOrder._id
                }
            }

            await findAndUpdateTransaction({ _id: transaction._id }, updateObject, { new: true })

            if(transaction.order) {
                // find order and update payment status to paid
                await findAndUpdateOrder({_id: transaction.order._id}, {paymentStatus: 'paid'}, {new: true})
            }


            // TODO: Send order receipt to the customer

            if (currentStore) {
                // Send real-time notification to business about new order
                websocketService.sendToBusiness(
                    currentStore._id.toString(),
                    'order:new',
                    {
                        orderId: transaction?.order?._id || newOrder?._id,
                        orderRef: transaction?.order?.orderRef || newOrder?.orderRef,
                        total: transaction?.order?.total || newOrder?.total,
                        status: 'paid',
                        customerName: customer.name,
                        table: transaction?.order?.table || newOrder?.table,
                        createdAt: transaction.order?.createdAt || newOrder?.createdAt
                    }
                );

                // if the business prefers real tiime settlements, send a transfer
                const businessSettings = await findBusinessSetting({business: currentStore._id}, 'receivingAccounts.account')
                if (businessSettings && businessSettings.settlements?.preferred === 'instant') {
                    const transferAccount = businessSettings.receivingAccounts?.find(acc => acc.preferredForRemittance === true)
                    if(!transferAccount) {
                        return
                    }

                    const trfRef = generateCode(18,true).toUpperCase()
                   
                    const transferFee = calculateTransferFee(transaction.amount)
                    sendTransferJob({
                        amount: transaction.amount - transferFee,
                        recipient:  transferAccount.account.paystackRecipientCode,
                        reference: trfRef,
                        reason:`settlement from order: ${transaction.order.orderRef} ${moment(transaction.order.createdAt).format('DD-MM-YYYY')}`
                    })
                }
            }

            return response.ok(res, {
                verification: verificationData, 
                order: transaction.order || newOrder
            })
        }
        
    } catch (error) {
        console.log(error)
        return response.error(res, error)
    }
}


export const paystackWebhookHandler = async (req: Request, res: Response) => {
    try {
        const flutterwaveConfig: any = config.get('flutterwave') 
        if (!req.headers['verif-hash'] || req.headers['verif-hash'] !== flutterwaveConfig.WEBHOOK_HASH) {
            return response.error(res, {message: 'Hash not provided or invalid'})
        } 

        const transaction = await findTransaction({transactionReference: req.body.data.txRef}, '')

        if(!transaction) {
            return response.error(res, {message: 'transaction not found'})
        }
        
        // TODO: Process the transaction same way as in the verifyTransactionHandler

        return response.ok(res, {data:'Transaction updated successfully'})
    } catch (error) {
        console.log(error)
        response.error(res, error)
    }

}

export const flutterwaveWebhookHandler = async (req: Request, res: Response) => {
    try {
        const flutterwaveConfig: any = config.get('flutterwave') 
        if (!req.headers['verif-hash'] || req.headers['verif-hash'] !== flutterwaveConfig.WEBHOOK_HASH) {
            return response.error(res, {message: 'Hash not provided or invalid'})
        } 

        const transaction = await findTransaction({transactionReference: req.body.data.txRef}, '')

        if(!transaction) {
            return response.error(res, {message: 'transaction not found'})
        }
        
        // update the transaction
        const transactionStatus = req.body.data.status.toUpperCase()
        const channelResponse = req.body.data

        const updateObject = {
            status: transactionStatus,
            processorData: channelResponse
        }

        await findAndUpdateTransaction({ _id: transaction._id }, updateObject, { new: true })

        
        // if(req.body.data.status === 'successful') {
        //     const invoice = await findInvoice(transaction.invoice)

        //     if(!invoice) {
        //         return response.error(res, {message: 'invoice not found'})
        //     }
            
        //     const invoiceUpdate = {
        //         status: transaction.amount === invoice.amount ? 'PAID' : 'PART_PAID'
        //     }
        //     await findAndUpdateInvoice({_id: invoice._id}, invoiceUpdate, {new: true})
        // }

        return response.ok(res, {data:'Transaction updated successfully'})
    } catch (error) {
        console.log(error)
        response.error(res, error)
    }

}