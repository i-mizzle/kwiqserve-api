import { Request, Response } from "express";
import * as response from '../responses'
import { get } from "lodash";
import { getJsDate } from "../utils/utils";
import { createCart, findAndUpdateCart, findCart, findCarts } from "../service/cart.service";

const parseCartFilters = (query: any) => {
    const { minDateCreated, maxDateCreated, clientId, store, checkoutStatus } = query; 

    const filters: any = {}; 

    // if (name) {
    //     filters.name = { $regex: name, $options: "i" }; 
    // }

        
    if (store) {
        filters.store = store
    }
    
    if (clientId) {
        filters.clientId = clientId
    }
    
    if (checkoutStatus) {
        filters.checkoutStatus = checkoutStatus
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

export const sendToCartHandler = async (req: Request, res: Response) => {
    try {
        const businessId = req.params.businessId
        const body = req.body
        const existingCart = await findCart({
            clientId: body.clientId, 
            table: body.table, 
            business: businessId, 
            deleted: false,
            checkoutStatus: 'pending'
        })
        let cart = null
        if(!existingCart) {
            // create cart if a cart doesn't exist for this client id
            const items = [body.item]
            const total = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
            cart = await createCart({
                clientId: body.clientId,
                business: businessId,
                items: items,
                table: body.table,
                total: total
            })
        } else {
            // if it does, update the cart with the new item
            cart = existingCart
            console.log('.... ', cart.items)
            const indexOfItemInCart = cart.items.findIndex((item: any) => 
                item.item.toString() === body.item.item.toString()
            )
            // check if item exists in cart, then increase the quantity if it does, if it doesn't add it.
            if(indexOfItemInCart < 0) {
                cart.items.push(body.item)
            } else {
                cart.items[indexOfItemInCart].quantity += body.item.quantity
            }
            // Calculate total
            const total = cart.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
            await findAndUpdateCart({_id: cart._id}, {...cart, total}, {new: true} )
        }
        const updatedCart = await findCart({_id: cart._id}, ['items.item','items.parentItem','items.parentItemCategory'])
        return response.ok(res, updatedCart)
    } catch (error:any) {
        console.log(error)
        return response.error(res, error)
    }
}

export const deductFromCartHandler = async (req: Request, res: Response) => {
    try {
        const storeId = get(req, 'params.businessId');
        const body = req.body
        const cart = await findCart({
            clientId: body.clientId, 
            business: storeId, 
            deleted: false
        })

        if(!cart) {
            return response.notFound(res, {message: 'shopping cart not found'})
        }

        let cartItems = cart.items

        const indexOfItemInCart = cart.items.findIndex((item: any) => 
            // item.item.toString() === body.item.item.toString()
            item.item.toString() === body.item.toString()
        )

        if(indexOfItemInCart < 0) {
            return response.notFound(res, {message: 'item not found in cart'})
        } 

        if(cartItems[indexOfItemInCart].quantity > body.quantity) {
            cartItems[indexOfItemInCart].quantity -= body.quantity
        } else {
            cartItems.splice(indexOfItemInCart, 1)
        }

        // Calculate total
        const total = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)

        await findAndUpdateCart({_id: cart._id}, {items: cartItems, total}, {new: true})

        const updatedCart = await findCart({_id: cart._id}, ['items.item','items.parentItem','items.parentItemCategory'])

        return response.ok(res, updatedCart)
    } catch (error:any) {
        return response.error(res, error)
    }
}

export const getCartsHandler = async (req: Request, res: Response) => {
    try {
        const queryObject: any = req.query;
        const filters = parseCartFilters(queryObject)
        const resPerPage = +queryObject.perPage || 25; 
        const page = +queryObject.page || 1; 
        let expand = queryObject.expand ||  null

        if(expand && expand.includes(',')) {
            expand = expand.split(',')
        }

        const items = await findCarts( {...filters, ...{ deleted: false }}, 0, 0, expand)
        const responseObject = {
            total: items.total,
            categories: items.categories
        }

        return response.ok(res, responseObject)        
    } catch (error:any) {
        return response.error(res, error)
    }
}

export const getClientCartHandler = async (req: Request, res: Response) => {
    try {
        const clientId = get(req, 'params.clientId');
        const storeId = get(req, 'params.businessId');
        const queryObject: any = req.query;
        let expand = queryObject.expand || null

        if(expand && expand.includes(',')) {
            expand = expand.split(',')
        }

        const cart = await findCart({ clientId: clientId, business: storeId, deleted: false, checkoutStatus: 'pending' }, expand)

        if(!cart) {
            return response.notFound(res, {message: 'cart not found'})
        }

        return response.ok(res, cart)
        
    } catch (error:any) {
        return response.error(res, error)
    }
}

export const getCartHandler = async (req: Request, res: Response) => {
    try {
        const cartId = get(req, 'params.cartId');
        const queryObject: any = req.query;
        let expand = queryObject.expand || null

        if(expand && expand.includes(',')) {
            expand = expand.split(',')
        }

        const menu = await findCart({ _id: cartId, deleted: false }, expand)

        if(!menu) {
            return response.notFound(res, {message: 'menu not found'})
        }

        return response.ok(res, menu)
        
    } catch (error:any) {
        return response.error(res, error)
    }
}

export const updateCartHandler = async (req: Request, res: Response) => {
    try {
        const cartId = get(req, 'params.cartId');
        let update = req.body

        const item = await findCart({_id: cartId})
        if(!item) {
            return response.notFound(res, {message: 'shopping cart not found'})
        }

        await findAndUpdateCart({_id: item._id}, update, {new: true})

        return response.ok(res, {message: 'shopping cart updated successfully'})
        
    } catch (error:any) {
        return response.error(res, error)
    }
}

export const deleteCartHandler = async (req: Request, res: Response) => {
    try {
        const menuId = get(req, 'params.categoryId');
        const cart = await findCart({_id: menuId})
        if(!cart) {
            return response.notFound(res, {message: 'shopping cart not found'})
        }

        await findAndUpdateCart({_id: cart._id}, {deleted: true}, {new: true})

        return response.ok(res, {message: 'shopping cart deleted successfully'})
        
    } catch (error:any) {
        return response.error(res, error)
    }
}
