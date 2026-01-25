import { DocumentDefinition, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import Customer, { CustomerDocument } from '../model/customer.model';

export async function createCustomer (input: DocumentDefinition<CustomerDocument>) {
    return Customer.create(input)
}

export async function findCustomers (
    query: FilterQuery<CustomerDocument>,
    perPage: number,
    page: number,
    options: QueryOptions = { lean: true },
    expand?: string,
) {
    const total = await Customer.find(query, {}, options).countDocuments()
    let customers = null
    if(perPage===0&&page===0){
        customers = await Customer.find(query, {}, options).populate(expand)
    } else {
        customers = await Customer.find(query, {}, options).populate(expand)
            .sort({ 'createdAt' : -1 })
            .skip((perPage * page) - perPage)
            .limit(perPage);
    }

    return {
        total,
        data: customers 
    }
}

export async function findCustomer (
    query: FilterQuery<CustomerDocument>,
    expand?: string,
    options: QueryOptions = { lean: true }
) {
    return Customer.findOne(query, {}, options).populate(expand)
}

export async function findAndUpdateCustomer (
    query: FilterQuery<CustomerDocument>,
    update: UpdateQuery<CustomerDocument>,
    options: QueryOptions
) {
    return Customer.findOneAndUpdate(query, update, options)
}

// export async function deleteCustomer(
//     query: FilterQuery<CustomerDocument>
// ) {
//     return Customer.deleteOne(query)
// }

