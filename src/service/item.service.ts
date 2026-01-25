import { DocumentDefinition, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import Item, { ItemDocument } from '../model/item.model';

export async function createItem (input: DocumentDefinition<ItemDocument>) {
    return Item.create(input)
}

export async function findItems(
    query: FilterQuery<ItemDocument>,
    perPage: number,
    page: number,
    expand?: string,
    options: QueryOptions = { lean: true }
) {
    const total = await Item.find(query, {}, options).countDocuments()
    let items = null
    if(perPage===0&&page===0){
        items = await Item.find(query, {}, options).populate(expand)
    } else {
        items = await Item.find(query, {}, options).populate(expand)
            .sort({ 'createdAt' : -1 })
            .skip((perPage * page) - perPage)
            .limit(perPage);
    }

    return {
        total,
        items 
    }
}

export async function findItem(
    query: FilterQuery<ItemDocument>,
    expand?: string,
    options: QueryOptions = { lean: true }
) {
    return Item.findOne(query, {}, options).populate(expand).populate({
        path: 'variants',
        populate: {
            path: 'recipe.item'
        }
    });
}

export async function findAndUpdateItem(
    query: FilterQuery<ItemDocument>,
    update: UpdateQuery<ItemDocument>,
    options: QueryOptions
) {
    return Item.findOneAndUpdate(query, update, options)
}