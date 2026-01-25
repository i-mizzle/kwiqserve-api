import { Request, Response, NextFunction } from "express";
import log from '../logger'
import * as response from "../responses/index";
import { DocumentDefinition } from "mongoose";
import { StoreDocument } from "../model/business.model";
import { validateActiveStore } from "../service/business.service";

// Extend Express Request to include careHome
declare global {
    namespace Express {
        interface Request {
            store?: DocumentDefinition<StoreDocument>; // Replace 'any' with the appropriate type for careHome
        }
    }
}

const validateStore = () => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const storeId = req.headers['x-store-id'] as string;
        const apiKey = req.headers['x-scanserve-api-key'] as string;
        const store = await validateActiveStore({
            storeId, apiKey 
        })

        if (!store) {
            return response.notFound(res, { message: 'store not found' });
        }

        req.store = store;

        return next();

    } catch (error: any) {
        log.error(error)
        response.forbidden(res, { message: error.errors })
    }
}

export default validateStore; 