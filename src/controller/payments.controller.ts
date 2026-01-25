import { Request, Response } from "express"
import { get } from "lodash";
import * as response from "../responses"
import { createTransaction, findAndUpdateTransaction, findTransaction, findTransactions } from "../service/transaction.service"
import { addDays, calculateFee, calculateTransferFee, generateCode } from "../utils/utils";
import config from 'config';
import { findUser } from "../service/user.service";
import { findAndUpdateOrder, findOrder } from "../service/order.service";
import { initiateTransaction, verifyTransaction } from "../service/integrations/paystack.service";
import { OrderDocument } from "../model/order.model";
import { findBusiness } from "../service/business.service";
import websocketService from "../service/websocket.service";
import { findCustomer } from "../service/customer.service";
import { findBusinessSetting } from "../service/business-setting.service";
import { sendTransferJob } from "../queues/transfer.queue";
import moment from "moment";

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
        const invoiceCode = req.body.invoiceCode
        const currentStore = await findBusiness({subdomain: req.businessSubdomain})
        if(!currentStore) {
            return response.notFound(res, {message: 'store not found'})
        }
        const user = await findUser({_id: userId})
        let userType = ""
        if(user) {
            userType = user.userType
        }

        // let order: OrderDocument | null = null // await findInvoice({invoiceCode}, 'user')
        // let subscriptionPlan: SubscriptionPlanDocument | null = null
        // if(!req.body.subscriptionPlan){
        const order = await findOrder({_id: req.body.order})
        // }

        // if(req.body.subscriptionPlan) {
        //     subscriptionPlan = await findSubscriptionPlan({_id: req.body.subscriptionPlan})
        // }
        
        if(!order) {
            return response.notFound(res, {message: "order not found"})
        }

        const transactionReference = generateCode(18, false)
        const transactionProcessor = req.body.paymentChannel === 'web' ? 'paystack' : 'cashier'
        const fees = calculateFee(order.total)
        const total = order.total + fees

        // CREATE TRANSACTION FIRST
        const newTransaction = await createTransaction({
            transactionReference,
            createdBy: userId,
            order: req.body.order, //invoice._id,
            amount: total,
            fees: fees,
            processor: transactionProcessor,
            channel: req.body.paymentChannel,
            business: currentStore._id
        })

        const input = {
            reference: newTransaction.transactionReference,
            amount: newTransaction.amount, //order!.amount,
            email: req.body.customer.email,
            callbackUrl: req.body.callbackUrl
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
        
        const transactionReference = get(req, 'params.paystackReference');
        const input = {
            reference: transactionReference
        }
        const verification = await verifyTransaction(input)
        console.log('---> ---> ', verification)
        
        if (verification.error) {
            return response.handleErrorResponse(res, verification)
        } else {
            const verificationData: any = verification.data.data
            const transaction = await findTransaction({transactionReference: verificationData.metadata.scanserveRef}, 'order')
            if(!transaction) {
                return response.notFound(res, {message: 'invoice transaction not found'})
            }

            const customer = await findCustomer({_id: transaction.order.customer})

            if(!customer) {
                return response.error(res, {message: 'customer not found'})
            }
            
            // update the transaction
            const transactionStatus = verificationData.status

            const updateObject = {
                status: transactionStatus === 'success' ? 'successful' : transactionStatus,
                processorData: verificationData,
                processorTransactionId: verificationData.reference
            }

            await findAndUpdateTransaction({ _id: transaction._id }, updateObject, { new: true })

            // find order and update payment status to paid
            await findAndUpdateOrder({_id: transaction.order._id}, {paymentStatus: 'paid'}, {new: true})

            // TODO: Send order receipt to the customer

            if (req.currentBusiness) {
                // Send real-time notification to business about new order
                websocketService.sendToBusiness(
                    req.currentBusiness._id.toString(),
                    'order:new',
                    {
                        orderId: transaction.order._id,
                        orderRef: transaction.order.orderRef,
                        total: transaction.order.total,
                        status: 'paid',
                        customerName: customer.name,
                        table: transaction.order.table,
                        createdAt: transaction.order.createdAt
                    }
                );

                // if the business prefers real tiime settlements, send a transfer
                const businessSettings = await findBusinessSetting({business: req.currentBusiness._id}, 'receivingAccounts.account')
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
                order: transaction.order
            })
        }
        
    } catch (error) {
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
        
        // update the transaction
        const transactionStatus = req.body.data.status.toUpperCase()
        const channelResponse = req.body.data

        const updateObject = {
            status: transactionStatus,
            processorData: channelResponse
        }

        await findAndUpdateTransaction({ _id: transaction._id }, updateObject, { new: true })

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