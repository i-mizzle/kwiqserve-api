import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import Business, { BusinessDocument } from '../model/business.model';
import { UserDocument } from "../model/user.model";
import { omit } from "lodash";

// interface CreateTripInput {
//     createdBy: UserDocument["_id"];
//     title: string
//     description?: string
//     origin : OriginDestination
//     destination : OriginDestination
//     price: number,
//     lockDownPrice: number,
//     startDate: StringDate,
//     endDate: StringDate
// }

interface BusinessInput {
    createdBy?: UserDocument['_id'];
    name: string;
    address: string;
    city: string;
    state: string;
}

export const createBusiness = async (
    input: BusinessInput) => {
    try {
        const trip = await Business.create(input)

        return trip
    } catch (error: any) {
        throw new Error(error)
    }
}

export async function findBusinesses(
    query: FilterQuery<BusinessDocument>,
    perPage: number,
    page: number,
    options: QueryOptions = { lean: true }
) {
    const total = await Business.find(query, {}, options).countDocuments()
    let businesses = null
    if(perPage===0&&page===0){
        businesses = await Business.find(query, {}, options)
    } else {
        businesses = await Business.find(query, {}, options)
            .select('-apiKey')
            .sort({ 'createdAt' : -1 })
            .skip((perPage * page) - perPage)
            .limit(perPage);
    }

    return {
        total,
        businesses
    }
}

export async function findBusiness(
    query: FilterQuery<BusinessDocument>,
    expand?: string | string[],
    options: QueryOptions = { lean: true }
) {
    try {
        const business = await Business.findOne(query, {}, options).select('-apiKey').populate(expand)
        return business
    } catch (error: any) {
        throw new Error(error)

    }
}

export async function findAndUpdateBusiness(
    query: FilterQuery<BusinessDocument>,
    update: UpdateQuery<BusinessDocument>,
    options: QueryOptions
) {

    try {
        return Business.findOneAndUpdate(query, update, options)
    } catch (error: any) {
        return {
            error: true,
            errorType: 'error',
            data: JSON.parse(error.error).message
        } 
    }
}

export async function validateActiveBusiness({
    storeId,
    apiKey
}: {
    storeId: UserDocument['username'];
    apiKey: string;
}) {
    const business = await Business.findOne({ storeId });
    
    if(!business) {
        return false
    }
    
    const isValid = await business.comparePassword(apiKey);
    if (!isValid) {
        return false
    }
    
    return business
}