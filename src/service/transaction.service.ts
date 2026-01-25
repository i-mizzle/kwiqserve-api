import { DocumentDefinition, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import Transaction, { TransactionDocument } from '../model/transaction.model';
import { generateCode } from '../utils/utils';

// import { CustomerValidationObject, validateCustomer } from './biller-providers/irecharge.service';

// export const transactionsWithUsers = async (transactions: any ) => {
//     const mutatedTransactions: any = await Promise.all(transactions.map(async (transaction: any) => {
//         if(transaction.user) {
//             const user = await findUser({_id: transaction.user})
//             // TO DO, REMOVE SENSITIVE USER DATTA

//             transaction.user = {
//                 name: user?.name,
//                 email: user?.email,
//                 phone: user?.phone,
//                 userCode: user?.userCode
//             }
//         }
//         return transaction
//     }))

//     return mutatedTransactions
// }


export async function createTransaction (input: DocumentDefinition<TransactionDocument>) {
    try {
        const ref = generateCode(16, true)
        return Transaction.create({...input, ...{transactionReference: ref}})
    } catch (error: any) {
        throw new Error(error);
    }
}

export async function findTransaction(
    query: FilterQuery<TransactionDocument>,
    expand: string,
    options: QueryOptions = { lean: true }
) {
    const transaction = Transaction.findOne(query, {}, options).populate(expand)
    // const transactionWithUser = await transactionsWithUsers([transaction])
    return transaction
}

// export async function findAllTransactions(
//     perPage: number,
//     page: number,
//     expand:string,
//     options: QueryOptions = { lean: true }
// ) {
//     const total = await Transaction.find().countDocuments()
//     const transactions = await Transaction.find({}, {}, options).populate(expand)
//         .sort({ 'createdAt' : -1 })
//         .skip((perPage * page) - perPage)
//         .limit(perPage)

//     return {
//         total,
//         data: transactions
//     }
// }

export async function findTransactions(
    query: FilterQuery<TransactionDocument>,
    perPage: number,
    page: number,
    expand: any,
    options: QueryOptions = { lean: true }
) {
    const total = await Transaction.find(query, {}, options).countDocuments()
    let transactions = null
    if(perPage===0&&page===0){
        transactions = await Transaction.find(query, {}, options).populate(expand)
    } else {
    transactions = await Transaction.find(query, {}, options).populate(expand)
        .sort({ 'createdAt' : -1 })
        .skip((perPage * page) - perPage)
        .limit(perPage);
    }
    return {
        total,
        data: transactions
    }
}

export async function findAndUpdateTransaction(
    query: FilterQuery<TransactionDocument>,
    update: UpdateQuery<TransactionDocument>,
    options: QueryOptions
) {
    return Transaction.findOneAndUpdate(query, update, options)
}

export async function deleteTransaction(
    query: FilterQuery<TransactionDocument>
) {
    return Transaction.deleteOne(query)
}
