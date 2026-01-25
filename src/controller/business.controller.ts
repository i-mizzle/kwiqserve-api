import { Request, Response } from "express";
import { get, omit } from "lodash";
import * as response from "../responses/index";
import log from "../logger";
import { findAllUsers, findAndUpdateUser, findUser } from "../service/user.service";
import { sendEmailJob } from "../queues/email.queue";
import { addDays, addMinutesToDate, generateCode } from "../utils/utils";
import config from 'config';
import { createConfirmationCode } from "../service/confirmation-code.service";
import { nanoid } from "nanoid";
import { findRole, findRoles } from "../service/role.service";
import { findItems } from "../service/item.service";
import { findMenus } from "../service/menu.service";
import { findOrders } from "../service/order.service";
import { findCategories } from "../service/category.service";
import { createBusiness, findAndUpdateBusiness, findBusiness, findBusinesses } from "../service/business.service";
import { findBusinessSetting } from "../service/business-setting.service";

const tokenTtl = config.get('resetTokenTtl') as number

export const createBusinessHandler = async (req: Request, res: Response) => {
    try {
        const input = req.body
        const business = await createBusiness(input)
        const creator = await findUser({_id: business.createdBy})

        // const subscriptionPlan = await findSubscriptionPlan({_id: input.subscriptionPlan})
        // if(!subscriptionPlan) {
        //     return response.notFound(res, {message: 'subscription plan not found'})
        // }

        if(creator) {
            const code = nanoid(45)
            const confirmationCode = await createConfirmationCode({
                code: code,
                type: 'email-confirmation',
                expiry: addMinutesToDate(new Date(), tokenTtl)
            })
            let userBusinesss = creator.businesses || []
            const role = await findRole({slug: 'business-owner'})
            userBusinesss.push({
                business: business._id,
                roles: [role && role._id]
            })
            
            await findAndUpdateUser({_id: creator._id}, {
                businesss: userBusinesss,
                confirmationCode: confirmationCode._id
            }, {new: true})

            sendEmailJob({
                action: 'email-confirmation-notification',
                data: {
                    mailTo: creator.email,
                    firstName: creator.name.split(' ')[0],
                    activationCode: code,
                    subdomain: input.subdomain   
                }
            })
        }

        // sendQrCodeJob({
        //     businessId: business._id.toString(),
        //     data: {
        //         businessFrontUrl: `https://${business.subdomain}.scanserve.cloud/businessfront`,
        //         priceCardUrl: `https://${business.subdomain}.scanserve.cloud/prices`
        //     }
        // })

        // if(subscriptionPlan.price > 0) {
        //     const transactionReference = generateCode(18, false)
        //     const transactionProcessor = 'paystack'
    
        //     // CREATE TRANSACTION FIRST
        //     const newTransaction = await createTransaction({
        //         transactionReference,
        //         createdBy: creator?._id,
        //         subscriptionPlan: subscriptionPlan._id,
        //         amount: subscriptionPlan?.price,
        //         processor: transactionProcessor,
        //         channel: 'web',
        //         business: business._id
        //     })
    
        //     const input = {
        //         reference: newTransaction.transactionReference,
        //         amount: newTransaction.amount, //order!.amount,
        //         email: creator!.email,
        //         callbackUrl: req.body.callbackUrl
        //     }
    
        //     const purchaseObject = await initiateTransaction(input) as { data: any }
        //     console.log('payment init data -> ', purchaseObject)
        //     return response.created(res, purchaseObject.data.data)
        // } else {
        //     // Create subscription for the business
        //     await createSubscription({
        //         business: business._id,
        //         subscriptionPlan: input.subscriptionPlan,
        //         expiryDate: addDays(30, new Date()),
        //         active: true
        //     })
        //     return response.created(res, business)
        // }

    } catch (error: any) {
        log.error(error)
        return response.error(res, error)
    }
}

export const validateSubdomainHandler = async (req: Request, res: Response) => {
    try {
        const subdomain = req.params.subdomain;
        const business = await findBusiness({subdomain: subdomain.toLowerCase()})

        return response.ok(res, {available: business ? false : true})

    } catch (error: any) {
        log.error(error)
        return response.error(res, error)
    }
}

export const getCurrentBusinessHandler = async (req: Request, res: Response) => {
    try {
        const subdomain = req.businessSubdomain;
        const business = await findBusiness({subdomain: subdomain})

        if(!business) {
            return response.notFound(res, {message: 'Business not found'})
        }

        // const businessSubscription = req.businessSubscription

        // if(!businessSubscription?.active || !businessSubscription.subscriptionPlan.features?.includes('e-commerce-support')){
        //     delete business.businessFront
        // }


        return response.ok(res, business)
    } catch (error: any) {
        log.error(error)
        return response.error(res, error)
    }
}

export const getBusinessDetailsHandler = async (req: Request, res: Response) => {
    try {
        const businessId = req.params.businessId;
        const business = await findBusiness({_id: businessId})

        if(!business) {
            return response.notFound(res, {message: 'Business not found'})
        }

        return response.ok(res, business)
    } catch (error: any) {
        log.error(error)
        return response.error(res, error)
    }
}

export const getBusinessesHandler = async (req: Request, res: Response) => {
    try {
        const queryObject: any = req.query;
        // const filters = parseOrderFilters(queryObject)
        const resPerPage = +queryObject.perPage || 25; 
        const page = +queryObject.page || 1; 
        let expand = queryObject.expand || null

        const businesses = await findBusinesses({}, resPerPage, page, expand)

        const responseObject = {
            page,
            perPage: resPerPage,
            total: businesses.total,
            businesss: businesses.businesses
        }

        return response.ok(res, responseObject)
    } catch (error: any) {
        log.error(error)
        return response.error(res, error)
    }
}

// export const generateBusinessQrCodesHandler = async (req: Request, res: Response) => {
//     try {
//         const queryObject: any = req.query;
//         // const filters = parseOrderFilters(queryObject)
//         const resPerPage = +queryObject.perPage || 25; 
//         const page = +queryObject.page || 1; 
//         let expand = queryObject.expand || null

//         const businesss = await findBusinesses({}, resPerPage, page, expand)

//         businesss.businesses.forEach(business => {
//             sendQrCodeJob({
//                 businessId: business._id.toString(),
//                 data: {
//                     businessFrontUrl: `https://${business.subdomain}.scanserve.cloud/businessfront`,
//                     priceCardUrl: `https://${business.subdomain}.scanserve.cloud/prices`
//                 }
//             })
//         })

//         const responseObject = {
//             page,
//             perPage: resPerPage,
//             total: businesss.total,
//             businesss: businesss.businesses
//         }

//         return response.ok(res, responseObject)
//     } catch (error: any) {
//         log.error(error)
//         return response.error(res, error)
//     }
// }

export async function updateBusinessHandler (req: Request, res: Response) {
    try {
        const businessId = req.params.businessId;
        const business = await findBusiness({_id: businessId})
        const update = req.body

        if(!business) {
            return response.notFound(res, {message: 'Business not found'})
        }
        const updatedBusiness = await findAndUpdateBusiness({ _id: businessId }, update, { new: true })
        return response.ok(res, updatedBusiness)
    } catch (error: any) {
        log.error(error)
        return response.error(res, error)
    }
}

export const businessSetupCompletionHandler = async (req: Request, res: Response) => {
    try { 
        const userId = get(req, 'user._id')
        const businessId = req.currentBusiness?._id;

        const user = await findUser({_id: userId})
        if(!user){
            return response.notFound(res, {message: 'user not found'})
        }
        
        const actions = {
            setupTaxes: false,
            setupReceivingAccounts: false,
            setupPosDevices: false,
            createSaleItems: false,
            createPriceCards: false,
            createItemCategories: false,
            makeSale: false,
            createUserRoles: false,
            onboardUsers: false,
            setupPromotion: false,
            setupSupplier: false
        }

        // taxes
        // const businessSettings = await findBusinessSetting({business: businessId})
        // if(businessSettings){
        //     actions.setupTaxes = businessSettings?.taxes.enabled 
        //     actions.setupReceivingAccounts = businessSettings?.receivingAccounts.enabled && businessSettings?.receivingAccounts?.accounts?.length > 0
        //     actions.setupPosDevices = businessSettings?.posDevices.enabled && businessSettings?.posDevices?.devices?.length > 0
        // }
                
        // create item categories
        const itemCategories = await findCategories({business: businessId}, 1, 1, '')
        actions.createItemCategories = itemCategories.total > 0

        // create sale items
        const saleItems = await findItems({business: businessId}, 1, 1)
        actions.createSaleItems = saleItems.total > 0

        // create price cards
        const priceCards = await findMenus({business: businessId}, 1, 1, '')
        actions.createPriceCards = priceCards.total > 0

        // make a sale
        const orders = await findOrders({business: businessId}, 1, 1, '')
        actions.makeSale = orders.total > 0

        // create user roles and users (check plan first)
        const roles = await findRoles({business: businessId}, 1, 1)
        actions.createUserRoles = roles.total > 0

        // create users (check plan first)
        const users = await findAllUsers({business: businessId}, 2, 1)
        actions.onboardUsers = users.total > 1

        // create a promotion
        // const promos = await findPromotions({business: businessId}, 1, 1)
        // actions.setupPromotion = promos.total > 0

        // Setup a supplier
        // const suppliers = await findSuppliers({business: businessId}, 1, 1)
        // actions.setupSupplier = suppliers.total > 0

        return response.ok(res, actions)        
    } catch (error:any) {
        return response.error(res, error)
    }
}