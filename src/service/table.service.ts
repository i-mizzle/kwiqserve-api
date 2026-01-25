import { DocumentDefinition, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import Table, { TableDocument } from '../model/table.model';

export async function createTable (input: DocumentDefinition<TableDocument>) {
    return Table.create(input)
}

export async function findTables(
    query: FilterQuery<TableDocument>,
    perPage: number,
    page: number,
    expand?: string,
    options: QueryOptions = { lean: true }
) {
    // return Table.find(query, {}, options).populate(expand)

    const total = await Table.find().countDocuments()
    const tables = await Table.find(query, {}, options).populate(expand)
        .sort({ 'createdAt' : -1 })
        .skip((perPage * page) - perPage)
        .limit(perPage)

    return {
        total,
        data: tables
    }
}

export async function findTable(
    query: FilterQuery<TableDocument>,
    expand?: string,
    options: QueryOptions = { lean: true }
) {
    return Table.findOne(query, {}, options).populate(expand)
}

export async function findAndUpdateTable(
    query: FilterQuery<TableDocument>,
    update: UpdateQuery<TableDocument>,
    options: QueryOptions
) {
    return Table.findOneAndUpdate(query, update, options)
}

export async function deleteTable(
    query: FilterQuery<TableDocument>
) {
    return Table.deleteOne(query)
}