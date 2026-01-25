import { DocumentDefinition, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import { UserDocument } from '../model/user.model';
import Order, { OrderDocument } from '../model/order.model';

export const orderTotal = (items: any, storeSettings: any) => {
    const totalPrice = items.reduce((a: any, b: any) => a + (b.price * b.quantity || 0), 0)
    let vat = 0

    if(storeSettings?.taxes && storeSettings?.taxes?.enabled === true){
        vat = totalPrice * (storeSettings?.taxes?.rate/100)
    }

    return {total: totalPrice, vat: vat}
}

export async function createOrder (input: DocumentDefinition<OrderDocument>) {
    return Order.create(input)
}

export async function findOrders (
    query: FilterQuery<OrderDocument>,
    perPage: number,
    page: number,
    expand: string,
    options: QueryOptions = { lean: true }
) {
    const total = await Order.find(query, {}, options).countDocuments()
    let orders = null
    if(perPage===0&&page===0){
        orders = await Order.find(query, {}, options).populate(expand)
    } else {
        orders = await Order.find(query, {}, options).populate(expand)
            .sort({ 'createdAt' : -1 })
            .skip((perPage * page) - perPage)
            .limit(perPage);
    }

    return {
        total,
        orders 
    }
}

export async function findOrder (
    query: FilterQuery<OrderDocument>,
    expand?: string,
    options: QueryOptions = { lean: true }
) {
    return Order.findOne(query, {}, options).populate(expand)
}

export async function findAndUpdateOrder (
    query: FilterQuery<OrderDocument>,
    update: UpdateQuery<OrderDocument>,
    options: QueryOptions
) {
    return Order.findOneAndUpdate(query, update, options)
}

export async function deleteOrder(
    query: FilterQuery<OrderDocument>
) {
    return Order.deleteOne(query)
}

export const orderItems = (order: any) => {
    console.log(order)
    let orderItemsString = ''

    if(order?.items && order?.items?.length > 0) {
        order?.items?.forEach((item: any, itemIndex: number) => {
            orderItemsString += `${item.quantity} unit(s) of ${item.displayName} at ${item.price}`
            if(itemIndex < order.items.length - 1){
                orderItemsString += ', '
            }
        })
    }
    return orderItemsString
}
