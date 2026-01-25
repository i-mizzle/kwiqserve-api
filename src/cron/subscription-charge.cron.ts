import cron from 'node-cron';
import log from "../logger";
import { findAndUpdatePromotion, findPromotions } from '../service/promotion.service';
import { PromotionDocument } from '../model/promotion.model';


export const scheduleSubscriptionPlanCharge = () => {
    // every day at midnight
    cron.schedule('0 0 * * *', async () => {

        // const promotions = await findPromotions({}, 0, 0)
        
        // if(!promotions) {
        //     log.warn('promotions error')
        // }

        // await Promise.all(promotions.promotions.map(async (promo: PromotionDocument) => {
        //     const today = new Date();
        //     today.setHours(0, 0, 0, 0);
            
        //     let update: any = {}
        //     if(promo.runTime.start <= today && promo.active === false) {
        //         update.active = true
        //     }

        //     if(promo.runTime.end <= today && promo.active === true) {
        //         update.active = false
        //     }

        //     await findAndUpdatePromotion({_id: promo._id}, update, {new: true})
        // }))
    });

    log.info('subscription plan charge scheduled');
};

