import { DocumentDefinition, FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import BusinessSetting, { BusinessSettingDocument } from "../model/business-setting.model"; 

export const createBusinessSetting = async (
    input: DocumentDefinition<BusinessSettingDocument>
) => {
    try {
        const setting = await BusinessSetting.create(input)

        return setting
    } catch (error: any) {
        throw new Error(error)
    }
}

export async function findBusinessSetting(
    query: FilterQuery<BusinessSettingDocument>,
    expand?: string | string[],
    options: QueryOptions = { lean: true }
) {
    try {
        const setting = await BusinessSetting.findOne(query, {}, options).populate(expand)
        
        return setting
    } catch (error: any) {
        throw new Error(error)

    }
}

export async function findAndUpdateBusinessSetting(
    query: FilterQuery<BusinessSettingDocument>,
    update: UpdateQuery<BusinessSettingDocument>,
    options: QueryOptions
) {

    try {
        return BusinessSetting.findOneAndUpdate(query, update, options)
    } catch (error: any) {
        return {
            error: true,
            errorType: 'error',
            data: JSON.parse(error.error).message
        } 
    }
}