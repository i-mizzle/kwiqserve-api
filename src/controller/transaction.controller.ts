import { Request, Response } from "express";
import { get } from "lodash";
import * as response from '../responses'
import { createTransaction, findAndUpdateTransaction, findTransaction, findTransactions } from "../service/transaction.service";
// import { generateCode } from "../utils/utils";
import { createUser, findUser } from "../service/user.service";
import { getJsDate } from "../utils/utils";
import * as Papa from 'papaparse';
import { orderItems } from "../service/order.service";

const parseTransactionFilters = (query: any) => {
    const { order, minAmount, maxAmount, minDate, maxDate, channel } = query; // assuming the query params are named 'name', 'price', 'startDate', and 'endDate'

    const filters: any = {}; // create an empty object to hold the filters

    if (channel) {
      filters.channel = channel; 
    }

    if (order) {
      filters.order = order; 
    }
  
    if (minAmount) {
      filters.amount = { $gte: +minAmount }; 
    }
  
    if (maxAmount) {
      filters.amount = { $lt: +maxAmount }; 
    }
  
    if (minDate) {
      filters.createdAt = { $gte: (getJsDate(minDate)) }; 
    }
  
    if (maxDate) {
      filters.createdAt = { $lte: getJsDate(maxDate) }; 
    }

    return filters
}

export async function createTransactionHandler (req: Request, res: Response) {
    try {
        const userId = get(req, 'user._id')
        const body = req.body

        if(get(req, 'user.accountType') === 'user' && body.status && body.status !== 'pending' && body.amount > 0) {
            return response.badRequest(res, {message: `Your account type cannot create transactions with a status of ${body.status}`})
        }

        let user = ''
        // const existingUser = await findUser({email: body.user.email}) 

        // if(existingUser) {
        //     user = existingUser._id
        // } else {
        //     const newUser = await createUser(body.user) 
        //     user = newUser._id
        // }

        body.user = user
        body.createdBy = userId

        const transaction = await createTransaction({ ...body, createdBy: userId })

        let payment = null
        if (!transaction) {
            return response.error(res, {message: `Sorry, there was an error creating your transaction`})
        }

        // if (transaction && transaction.amount > 0 && get(req, 'user.accountType') === 'USER') {
        //     payment = await initializePurchase({
        //         transactionReference: transaction.transactionReference,
        //         amount: transaction.amount,
        //         customerName: get(req, 'user.name'),
        //         customerEmail: get(req, 'user.email'),
        //         customerPhone: get(req, 'user.phone'),
        //         redirectUrl: body.redirectUrl
        //     })
        // }

        // if(payment) {
        //     // transaction.payment = payment.data
        //     return response.created(res, {...transaction, ...{payment: payment!.data}})
        // } else {
            return response.created(res, transaction)
        // }

    } catch (error) {
        console.log(error)
        return response.error(res, error)
    }
}

export async function updateTransactionHandler (req: Request, res: Response) {
    try {
        const transactionReference = get(req, 'params.transactionRef');
        const update = req.body;
    
        const item = await findTransaction({ transactionReference }, '');
        if (!item) {
            return response.notFound(res, { message: `Transaction with reference: ${transactionReference} was not found` })
        }
        const updatedTransaction = await findAndUpdateTransaction({ transactionReference }, update, { new: true })
        return response.ok(res, updatedTransaction)
    } catch (error) {
        return response.error(res, error)
    }
}

export async function getTransactionHandler (req: Request, res: Response) {
    try {
        const user: any = get(req, 'user')

        const transactionReference = get(req, 'params.transactionReference');
        const queryObject: any = req.query;
        let expand = queryObject.expand || null

        if(expand && expand.includes(',')) {
            expand = expand.split(',')
        }
        let transactionsQuery: any = {transactionReference: transactionReference, user: user?._id}
        
        if(user?.userType === 'ADMIN' || user?.userType === 'SUPER_ADMINISTRATOR' ) {
            transactionsQuery = {transactionReference: transactionReference}
        } 
    
        const transaction = await findTransaction({ transactionReference }, expand);
        if (!transaction) {
            return response.notFound(res, { message: `transaction not found` })
        }

        return response.ok(res, transaction)
    } catch (error) {
        return response.error(res, error)
    }
}

export async function getAllTransactionsHandler (req: Request, res: Response) {
    try {
        const user: any = get(req, 'user')
        const storeId = req.currentBusiness?._id
        const queryObject: any = req.query;
        const filters = parseTransactionFilters(queryObject)
        const resPerPage = +queryObject.perPage || 25; // results per page
        const page = +queryObject.page || 1; // Page 

        let expand = queryObject.expand || null

        if(expand && expand.includes(',')) {
            expand = expand.split(',')
        }
        
        let transactionsQuery: any = {business: storeId}

        // if(user?.userType === 'ADMIN' || user?.userType === 'SUPER_ADMINISTRATOR' ) {
        //     transactionsQuery = {}
        // }
        
        const transactions = await findTransactions({...transactionsQuery, ...filters}, resPerPage, page, expand);

        const responseObject = {
            page,
            perPage: resPerPage,
            total: transactions.total,
            transactions: transactions.data
        }
        return response.ok(res, responseObject)
    } catch (error) {
        return response.error(res, error)
    }
}

export async function adminGetTransactionsByUserHandler (req: Request, res: Response) {
    try {
        const queryObject: any = req.query;
        const userCode = get(req, 'params.userCode');
        let expand = queryObject.expand || null

        if(expand && expand.includes(',')) {
            expand = expand.split(',')
        }

        const user = await findUser({userCode})
        let transactionsQuery: any = {user: user?._id}

        if(!user) {
            return response.notFound(res, {message: `user with user code: ${userCode} not found`})
        }

        const resPerPage = +queryObject.perPage || 25; // results per page
        const page = +queryObject.page || 1; // Page 
        const transactions = await findTransactions({user: user!._id}, resPerPage, page, expand );
    
        const responseObject = {
            page,
            perPage: resPerPage,
            total: transactions.total,
            transactions: transactions.data
        }
        return response.ok(res, responseObject)
    } catch (error) {
        return response.error(res, error)
    }
}

export const exportTransactionsToCsvHandler = async (req: Request, res: Response) => {
    try {
        const user: any = get(req, 'user')
        const queryObject: any = req.query;
        const filters = parseTransactionFilters(queryObject)
        const resPerPage = +queryObject.perPage || 25; // results per page
        const page = +queryObject.page || 1; // Page 

        let expand = ['order','createdBy']
        // if(expand && expand.includes(',')) {
        //     expand = expand.split(',')
        // }
        
        let transactionsQuery: any = {business: req.currentBusiness?._id}

        if(user?.userType === 'admin' || user?.userType === 'super-administrator' ) {
            transactionsQuery = {}
        }
        
        const transactions = await findTransactions({...transactionsQuery, ...filters}, 0, 0, expand);

        let data: any = []

        data = transactions.data.map((item: any) => {
            console.log('an item ---> ', item)
            let receivingChannel = ''
            if(item.channel === 'transfer' && item.receivingChannel) {
                receivingChannel = `${item.receivingChannel?.bank} - ${item.receivingChannel?.accountNumber}`
            }
            if(item.channel === 'pos' && item.receivingChannel){
                receivingChannel = `${item.receivingChannel?.deviceName}`
            }
            const itemBody = {
                "transaction reference": item.transactionReference,
                order: item?.order?.alias,
                "items purchased": orderItems(item.order),
                channel: item.channel,
                "receiving channel": receivingChannel,
                "received by": item.createdBy?.name,
                amount: item.amount,
                "time stamp": `${new Date(item?.createdAt).toDateString()} - ${new Date(item?.createdAt).toLocaleTimeString()}`
            }
            
            return itemBody
        });

        const csvString = Papa.unparse(data, { header: true });

        res.setHeader('Content-Disposition', 'attachment; filename=output.csv');
        res.setHeader('Content-Type', 'text/csv');
        res.status(200).send(csvString);
    } catch (error) {
        console.error(error);
        return response.error(res, error)
    }
}

// const orderItems = (order: any) => {
//     console.log(order)
//     let orderItemsString = ''

//     if(order?.items && order?.items?.length > 0) {
//         order?.items?.forEach((item: any, itemIndex: number) => {
//             orderItemsString += `${item.quantity} unit(s) of ${item.displayName} at ${item.price}`
//             if(itemIndex < order.items.length - 1){
//                 orderItemsString += ', '
//             }
//         })
//     }
//     return orderItemsString
// }

// export async function getTransactionsByPaymentItemHandler (req: Request, res: Response) {
//     try {
//         const queryObject: any = req.query;
//         const user = get(req, 'user');
//         const item = get(req, 'params.itemCode')

//         const paymentItem = await findPaymentItem({billerItemCode: item})
//         if(!paymentItem) {
//             return response.notFound(res, { message: `Payment item with item code ${item} was not found` })
//         }
//         // const biller = await findTransaction({ userCode });
//         const resPerPage = +queryObject.perPage || 25; // results per page
//         const page = +queryObject.page || 1; // Page 

//         const transactions = await findTransactions({item: paymentItem._id}, resPerPage, page );
    
//         const responseObject = {
//             page,
//             perPage: resPerPage,
//             total: transactions.total,
//             transactions: transactions.data
//         }
//         return response.ok(res, responseObject)
//     } catch (error) {
//         return response.error(res, error)
//     }
// }

// export async function rollbackTransactionHandler (req: Request, res: Response) {
//     try {
//         // const transactionReference = get(req, 'params.transactionRef');
//         const update = req.body;
//         const user = get(req, 'user');
        
//         // Get the transaction details from the transaction Ref sent in request
//         const transaction = await findTransaction({ transactionReference: update.transactionReference });
//         if (!transaction) {
//             return response.notFound(res, { message: `Transaction with reference: ${update.transactionReference} was not found` })
//         }
//         // Reject the rollback if the transaction was successful

//         // get user wallet details
//         const userWallet = await findWallet({ user: transaction.user })
//         if (!userWallet) {
//             return response.notFound(res, { message: `User wallet not found. User needs a wallet to rollback transaction into` })
//         }

//         // Find the associated support ticket 
//         let ticket = null 
//         if (update.ticketCode && update.ticketCode !== '') {
//             ticket = await findSupportTicket({ticketCode: update.ticketCode})

//             if (!ticket) {
//                 return response.notFound(res, { message: `Provided support ticket: ${update.ticketCode} was not found` })
//             }
//         }
        
//         let updateObject = {
//             status: 'ROLLED_BACK',
//             rollbackDetails: {
//               reason: update.rollBackReason,
//               ticket: ticket?._id,
//               rolledBackBy: user._id
//             },
//         }

//         // check transaction source
//         // if source is monnify, just label the transaction as rolled back and insert reason + ticket id
//         if (transaction.source !== 'MONNIFY_WALLET') {
//             const rollBackTransactionReference = generateCode(20, true)
//             const payout = await initializePayout({
//                 bankCode: userWallet.bankCode,
//                 accountNumber: userWallet.accountNumber,
//                 amount: transaction.amount,
//                 narration: `Transaction Roll back - REF #${transaction.transactionReference}`,
//                 transactionReference: rollBackTransactionReference,
//             })

//             if(payout.error) {
//                 return response.error(res, { message: 'Sorry, could not roll back the transaction at the moment. Please try again later' })
//             }

//         }
        
//         // if the source is cash initiate a transfer to the user from payafrik's flutterwave wallet... 
//         // if the transfer is successful, update the transaction details 
//         const updatedTransaction = await findAndUpdateTransaction({ transactionReference: update.transactionReference }, updateObject, { new: true })

//         return response.ok(res, updatedTransaction)

//     } catch (error) {
//         return response.error(res, error)
//     }
// }

// export async function frontendRollbackTransactionHandler (req: Request, res: Response) {
//     try {
//         // const transactionReference = get(req, 'params.transactionRef');
//         const update = req.body;
//         const user = get(req, 'user');
        
//         // Get the transaction details from the transaction Ref sent in request
//         const transaction = await findTransaction({ transactionReference: update.transactionReference });
//         if (!transaction) {
//             return response.notFound(res, { message: `Transaction with reference: ${update.transactionReference} was not found` })
//         }
//         // Reject the rollback if the transaction was successful

//         // get user wallet details
//         const userWallet = await findWallet({ user: transaction.user })
//         if (!userWallet) {
//             return response.notFound(res, { message: `User wallet not found. User needs a wallet to rollback transaction into` })
//         }

//         // Find the associated support ticket 
//         let ticket = null 
//         if (update.ticketCode && update.ticketCode !== '') {
//             ticket = await findSupportTicket({ticketCode: update.ticketCode})

//             if (!ticket) {
//                 return response.notFound(res, { message: `Provided support ticket: ${update.ticketCode} was not found` })
//             }
//         }
        
//         let updateObject = {
//             status: 'ROLLED_BACK',
//             rollbackDetails: {
//               reason: update.rollBackReason,
//               ticket: ticket?._id,
//               rolledBackBy: user._id
//             },
//         }

//         // check transaction source
//         // if source is monnify, just label the transaction as rolled back and insert reason + ticket id
//         if (transaction.source !== 'MONNIFY_WALLET') {
//             return response.error(res, { message: 'Sorry, Only a wallet transaction can be rolled-back automatically' })
//         }
        
//         // if the source is cash deny the request... 
//         // if the transfer is successful, update the transaction details 
//         const updatedTransaction = await findAndUpdateTransaction({ transactionReference: update.transactionReference }, updateObject, { new: true })

//         return response.ok(res, updatedTransaction)

//     } catch (error) {
//         return response.error(res, error)
//     }
// }
