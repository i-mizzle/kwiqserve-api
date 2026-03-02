import { DocumentDefinition, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import PendingFee, { PendingFeeDocument } from '../model/pending-fee.model';

export async function createPendingFee (input: DocumentDefinition<PendingFeeDocument>) {
    return PendingFee.create(input)
}

export async function findPendingFees(
    query: FilterQuery<PendingFeeDocument>,
    perPage: number,
    page: number,
    expand?: string,
    options: QueryOptions = { lean: true }
) {
    // return PendingFee.find(query, {}, options).populate(expand)

    const total = await PendingFee.find(query).countDocuments()
    const pendingFees = await PendingFee.find(query, {}, options).populate(expand)
        .sort({ 'createdAt' : -1 })
        .skip((perPage * page) - perPage)
        .limit(perPage)

    return {
        total,
        data: pendingFees
    }
}

export async function findPendingFee(
    query: FilterQuery<PendingFeeDocument>,
    expand?: string,
    options: QueryOptions = { lean: true }
) {
    return PendingFee.findOne(query, {}, options).populate(expand)
}

export async function findAndUpdatePendingFee(
    query: FilterQuery<PendingFeeDocument>,
    update: UpdateQuery<PendingFeeDocument>,
    options: QueryOptions
) {
    return PendingFee.findOneAndUpdate(query, update, options)
}

export async function deletePendingFee(
    query: FilterQuery<PendingFeeDocument>
) {
    return PendingFee.deleteOne(query)
}