import { DocumentDefinition, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import Cart, { CartDocument } from '../model/cart.model';

export async function createCart (input: DocumentDefinition<CartDocument>) {
    return Cart.create(input)
}

export async function findCarts(
    query: FilterQuery<CartDocument>,
    perPage: number,
    page: number,
    expand: string,
    options: QueryOptions = { lean: true }
) {
    const total = await Cart.find(query, {}, options).countDocuments()
    let categories = null
    if(perPage===0&&page===0){
        categories = await Cart.find(query, {}, options).populate(expand)
    } else {
        categories = await Cart.find(query, {}, options).populate(expand)
            .sort({ 'createdAt' : -1 })
            .skip((perPage * page) - perPage)
            .limit(perPage);
    }

    return {
        total,
        categories 
    }
}

export async function findCart(
    query: FilterQuery<CartDocument>,
    expand?: any,
    options: QueryOptions = { lean: true }
) {
    return Cart.findOne(query, {}, options).populate(expand)
}

export async function findAndUpdateCart(
    query: FilterQuery<CartDocument>,
    update: UpdateQuery<CartDocument>,
    options: QueryOptions
) {
    return Cart.findOneAndUpdate(query, update, options)
}