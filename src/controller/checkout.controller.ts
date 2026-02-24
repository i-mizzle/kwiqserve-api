import { Request, Response } from "express";
import * as response from '../responses'
import { AnyKindOfDictionary, get } from "lodash";
import { findAndUpdateCart, findCart } from "../service/cart.service";
import { createOrder, orderTotal } from "../service/order.service";
import { checkItemInventory, deductItemInventory } from "../service/item-variant.service";
import { sendOrderNotification, sendOrderNotificationToUser } from "../service/mailer.service";
import { findBusiness } from "../service/business.service";
import { findBusinessSetting } from "../service/business-setting.service";

export const checkoutHandler = async (req: Request, res: Response) => {
    try {
        // const userId = get(req, 'user._id');
        const cartId = get(req, 'params.cartId');
        const body = req.body;

        // get store 
        const business = await findBusiness({_id: body.business})
        if(!business) {
            return response.notFound(res, {message: `business not found`})
        }

        const storeSettings = await findBusinessSetting({_id: body.business})

        // get cart 
        const cart = await findCart({_id: cartId})
        if(!cart) {
            return response.notFound(res, {message: `cart not found`})
        }
        const cartUpdate = {
            checkoutStatus: 'checked_out'
        }

        // const inventoryErrors: string[] = []

        // // check first if all inventory items have enough stock
        // await Promise.all(cart.items.map(async (item: any) =>{
        //     const checkResult = await checkItemInventory(item.item, item.quantity)
        //     if(checkResult.error === true) {
        //         inventoryErrors.push(checkResult.data)
        //     }
        // }))

        // if(inventoryErrors.length > 0 ){
        //     return response.badRequest(res, {data: inventoryErrors.join(', ')})
        // }

        // // Deduct all inventory items
        // await Promise.all(cart.items.map(async (item: any) =>{
        //     await deductItemInventory(item.item, item.quantity)
        // }))

        // update cart checkout status
        await findAndUpdateCart({_id: cartId}, cartUpdate, {new: true})

        // create order pulling cart items and total price and set payment status to pending
        const orderPayload: any = {
            alias: `table-order-${cartId}`,
            source: 'ONLINE',
            items: cart.items,
            total: body.total,
            status: 'PENDING',
            paymentStatus: 'PAID',
            sourceMenu: body.sourceMenu,
            store: body.store,
            cart: cart._id,
            orderBy: body.orderBy,
            deliveryType: body.deliveryType,
            deliveryAddress: body.deliveryAddress,
            paymentMethod: body.paymentMethod,
            vat: orderTotal(cart.items, storeSettings).vat
        }

        if(body.deliveryType === 'DOORSTEP') {
            orderPayload.deliveryAddress = body.deliveryAddress
        }

        if(body.deliveryType === 'PICKUP') {
            orderPayload.pickupOutlet = body.pickupOutlet
        }

        const order = await createOrder(orderPayload)

        let deliveryAddress

        if(body.deliveryAddress) {
            deliveryAddress = body.deliveryAddress?.address + ', (' + body.deliveryAddress?.description ? body.deliveryAddress?.description : '' + '), ' + body.deliveryAddress?.city
        }

        // notify the store about the new order
        await sendOrderNotificationToUser({
            mailTo: body.orderBy.email,
            items: cart.items,
            deliveryType: body.deliveryType,
            paymentMethod: body.paymentMethod,
            storeName: business.name,
            deliveryAddress: deliveryAddress,
            orderBy: body.orderBy,
            total: `${(orderTotal(cart.items, storeSettings).total + orderTotal(cart.items, storeSettings).vat).toLocaleString()}`
        })
        
        // notify the store about the new order
        await sendOrderNotification({
            mailTo: business.email,
            items: cart.items,
            deliveryType: body.deliveryType,
            paymentMethod: body.paymentMethod,
            deliveryAddress: deliveryAddress,
            orderBy: body.orderBy,
            storeName: business.name,
            total: `${(orderTotal(cart.items, storeSettings).total + orderTotal(cart.items, storeSettings).vat).toLocaleString()}`
        })

        return response.created(res, {message: 'checked out successfully, order created', order: order});
    } catch (error) {
        return response.error(res, error);
    }
}; 