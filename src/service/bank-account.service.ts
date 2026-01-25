import { DocumentDefinition, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import BankAccount, { BankAccountDocument } from '../model/bank-account.model';

export async function createBankAccount (input: DocumentDefinition<BankAccountDocument>) {
    return BankAccount.create(input)
}

export async function findBankAccounts(
    query: FilterQuery<BankAccountDocument>,
    perPage: number,
    page: number,
    expand: string,
    options: QueryOptions = { lean: true }
) {
    const total = await BankAccount.find(query, {}, options).countDocuments()
    let bankAccounts = null
    if(perPage===0&&page===0){
        bankAccounts = await BankAccount.find(query, {}, options).populate(expand)
    } else {
        bankAccounts = await BankAccount.find(query, {}, options).populate(expand)
            .sort({ 'createdAt' : -1 })
            .skip((perPage * page) - perPage)
            .limit(perPage);
    }

    return {
        total,
        bankAccounts 
    }
}

export async function findBankAccount(
    query: FilterQuery<BankAccountDocument>,
    expand?: string,
    options: QueryOptions = { lean: true }
) {
    return BankAccount.findOne(query, {}, options).populate(expand)
}

export async function findAndUpdateBankAccount(
    query: FilterQuery<BankAccountDocument>,
    update: UpdateQuery<BankAccountDocument>,
    options: QueryOptions
) {
    return BankAccount.findOneAndUpdate(query, update, options)
}

export async function deleteBankAccount(
    query: FilterQuery<BankAccountDocument>
) {
    return BankAccount.deleteOne(query)
}