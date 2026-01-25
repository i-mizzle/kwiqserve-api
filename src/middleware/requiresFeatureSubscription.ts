import { get } from 'lodash'
import { Request, Response, NextFunction, request } from 'express'
import * as response from "../responses/index";
import { DocumentDefinition } from 'mongoose';
import { StoreDocument } from '../model/business.model';
import { SubscriptionDocument } from '../model/subscription.model';

declare global {
    namespace Express {
        interface Request {
            currentbusiness: DocumentDefinition<StoreDocument>;
            permissions: string[];
            storeSubscription?: DocumentDefinition<SubscriptionDocument>
        }
    }
}

const requiresFeatureSubscription = (feature: string) => async (req: Request, res: Response, next: NextFunction) => {

    const subscriptionPlan = req.storeSubscription
    
    if(!subscriptionPlan?.subscriptionPlan.features.includes(feature)){
        response.forbidden(res, { message: "You do not have the required subscription plan to access this resource" })
        return
    }

    return next();
}

export default requiresFeatureSubscription