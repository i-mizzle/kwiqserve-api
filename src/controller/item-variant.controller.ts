import { Request, Response } from "express";
import * as response from '../responses'
import { get } from "lodash";
import { addMinutesToDate, generateCode, getJsDate } from "../utils/utils";
import { createItem, findAndUpdateItem, findItem, findItems } from "../service/item.service";
import { createVariant, findAndUpdateVariant } from "../service/item-variant.service";
import { ItemVariantDocument } from "../model/item-variant.model";
import { findAndUpdateMenu, findMenus } from "../service/menu.service";
import { MenuDocument } from "../model/menu.model";

const parseItemFilters = (query: any) => {
    const { minDateCreated, noStock, maxDateCreated, enquiryType, status, maritalStatus, name, email, phone, nationality, invoice, appointment, visaEnquiryCountry, travelHistory, paymentStatus } = query; 

    const filters: any = {}; 

    if (enquiryType) {
        filters.enquiryType = enquiryType
    } 

    if (noStock) {
        filters.noStock = noStock
    } 

    if (paymentStatus) {
        filters.paymentStatus = paymentStatus;
    } 
    
    if (status) {
        filters.status = status
    }

    if (maritalStatus) {
        filters.maritalStatus = maritalStatus
    }
    
    if (name) {
        filters.name = name; 
    }
    
    if (email) {
        filters.email = email; 
    }
        
    if (phone) {
        filters.phone = phone; 
    }
        
    if (invoice) {
        filters.invoice = invoice; 
    }
  
    if (nationality) {
        filters.nationality = nationality 
    }
  
    if (appointment) {
        filters.appointment = appointment; 
    }
  
    if (visaEnquiryCountry) {
        filters.visaEnquiryCountry = visaEnquiryCountry; 
    }
  
    if (travelHistory) {
        filters.travelHistory = travelHistory; 
    }

    if (minDateCreated && !maxDateCreated) {
        filters.createdAt = { $gte: (getJsDate(minDateCreated)) }; 
    }

    if (maxDateCreated && !minDateCreated) {
        filters.createdAt = { $lte: getJsDate(maxDateCreated) }; 
    }

    if (minDateCreated && maxDateCreated) {
        filters.date = { $gte: getJsDate(minDateCreated), $lte: getJsDate(maxDateCreated) };
    }
  
    return filters

}


export const createItemVariantHandler = async (req: Request, res: Response) => {
    try {
        const userId = get(req, 'user._id');
        let body = req.body

        const item = await createItem({...body, ...{createdBy: userId}})
        const variants: ItemVariantDocument[] = []
        const update: ItemVariantDocument['_id'][] = []

        body.variants.forEach(async (variant: ItemVariantDocument, variantIdex: number) => {
            const newVariant = await createVariant({...variant, })
            variants.push(newVariant)
            update.push(newVariant.id)
        })

        const updatedItem = await findAndUpdateItem({_id: item._id}, {variants: update}, {new: true})
        return response.created(res, updatedItem)
        // return response.created(res, {...item, ...{variants: variants}})
    } catch (error:any) {
        return response.error(res, error)
    }
}

export const getItemVariantsHandler = async (req: Request, res: Response) => {
    try {
        const queryObject: any = req.query;
        const filters = parseItemFilters(queryObject)
        const resPerPage = +queryObject.perPage || 25; 
        const page = +queryObject.page || 1; 
        let expand = queryObject.expand || null

        if(expand && expand.includes(',')) {
            expand = expand.split(',')
        }

        const items = await findItems( {...filters, ...{ deleted: false }}, resPerPage, page, expand)
        // return res.send(post)

        const responseObject = {
            page,
            perPage: resPerPage,
            total: items.total,
            enquiries: items.items
        }

        return response.ok(res, responseObject)        
    } catch (error:any) {
        return response.error(res, error)
    }
}

// export const getItemHandler = async (req: Request, res: Response) => {
//     try {
//         const itemId = get(req, 'params.itemId');
//         const queryObject: any = req.query;
//         let expand = queryObject.expand || null

//         if(expand && expand.includes(',')) {
//             expand = expand.split(',')
//         }

//         const item = await findItem({ _id: itemId, deleted: false }, expand)

//         if(!item) {
//             return response.notFound(res, {message: 'item not found'})
//         }

//         return response.ok(res, item)
        
//     } catch (error:any) {
//         return response.error(res, error)
//     }
// }

export const updateItemHandler = async (req: Request, res: Response) => {
    try {
        const itemId = get(req, 'params.itemId');
        const userId = get(req, 'user._id');
        let update = req.body

        const item = await findItem({_id: itemId})
        if(!item) {
            return response.notFound(res, {message: 'item not found'})
        }


        await findAndUpdateItem({_id: item._id}, update, {new: true})

        return response.ok(res, {message: 'item updated successfully'})
        
    } catch (error:any) {
        return response.error(res, error)
    }
}

export const deleteItemVariantHandler = async (req: Request, res: Response) => {
    try {
        const variantId = get(req, 'params.variantId');
        const userId = get(req, 'user._id')
        const variant = await findItem({_id: variantId})
        if(!variant) {
            return response.notFound(res, {message: 'item variant not found'})
        }

        // find variants in menus
        const filters: any = {}
        filters['items.item'] = variant._id

        const menusWithVariant = await findMenus(filters, 0, 0, '')

        if(menusWithVariant && menusWithVariant.menus.length > 0 ) {
            // delete all of this variant from every menu
            menusWithVariant.menus.forEach( async (menu: MenuDocument, menuIndex: number) => {
                const itemsWithVariantRemoved = menu.items.filter(item => {
                    return item.item !== variantId;
                })
                await findAndUpdateMenu({_id: menu._id}, {items: itemsWithVariantRemoved}, {new: true})
            })
        }

        await findAndUpdateVariant({_id: variant._id}, {deleted: true, item: ''}, {new: true})

        return response.ok(res, {message: 'item variant deleted successfully'})
        
    } catch (error:any) {
        return response.error(res, error)
    }
}
