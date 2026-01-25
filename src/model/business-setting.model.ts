import mongoose from 'mongoose';
import { BusinessDocument } from './business.model';
import { BankAccountDocument } from './bank-account.model';

export interface BusinessSettingDocument extends mongoose.Document {
    business: BusinessDocument['_id'];
    taxes?: {
        enabled: boolean
        includeTaxesInMenu: boolean
        rate: number
    }
    receivingAccounts?: {
        account: BankAccountDocument['_id']
        preferredForRemittance: boolean
    }[]
    posDevices?: {
        deviceName: string
        provider: string
        serialNumber: string
    }[]
    settlements?: {
        preferred: 'next-working-day' | 'on-demand' | 'instant'
        settlementTime: string
    }
    // deliveryCharges: {
    //     enabled: boolean
    //     charges: {
    //         location: string,
    //         charge: number
    //     }[]
    // },
    reviews?: {
        enabled: boolean
        // storeFront: boolean
        // publicPriceCard: boolean,
        autoPublish: boolean
    },
    // onlinePayments: {
    //     enabled: boolean
    //     integrations: {
    //         flutterwave: {
    //             publicKey: string
    //         },
    //         // paystack: {
    //         //     publicKey: string
    //         // },
    //     },
    // },
    createdAt?: Date;
    updatedAt?: Date;
}

const BusinessSettingSchema = new mongoose.Schema(
    {
        business: {
            type: mongoose.Schema.Types.ObjectId, ref: 'Business'
        },
        taxes: {
            enabled: {
                type: Boolean,
                default: false
            },
            includeTaxesInMenu: {
                type: Boolean,
                default: false
            },
            rate: {
                type: Number
            },
        },
        receivingAccounts: [
            {
                account: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'BankAccount'
                },
                preferredForRemittance: {
                    type: Boolean
                }
            }
        ],
        posDevices: [
            {
                deviceName: {
                    type: String
                },
                provider: {
                    type: String
                },
                serialNumber: {
                    type: String
                }
            }
        ],
        settlements: {
            preferred: {
                type: String,
                enum: ['next-working-day', 'on-demand', 'instant'],
                default: 'next-working-day'
            },
            settlementTime: {
                type: String
            }
        }
        // deliveryCharges: {
        //     enabled: {
        //         type: Boolean,
        //         default: false
        //     },
        //     charges: [
        //         {
        //             location: {
        //                 type: String
        //             },
        //             charge: {
        //                 type: Number
        //             },
        //         }
        //     ]
        // },
        // reviews: {
        //     enabled: {
        //         type: Boolean,
        //         default: false
        //     },
        //     storeFront: {
        //         type: Boolean,
        //         default: false
        //     },
        //     publicPriceCard: {
        //         type: Boolean,
        //         default: false
        //     },
        //     autoPublish: {
        //         type: Boolean,
        //         default: false
        //     },
        // },
        // onlinePayments: {
        //     enabled: {
        //         type: Boolean,
        //         default: false
        //     },
        //     integrations: {
        //         flutterwave: {
        //             publicKey: {
        //                 type: String
        //             }
        //         },
        //         // paystack: {
        //         //     publicKey: {
        //         //         type: String
        //         //     }
        //         // }
        //     }
        // },
        
    },
    { timestamps: true }
);


const BusinessSetting = mongoose.model<BusinessSettingDocument>('BusinessSetting', BusinessSettingSchema);

export default BusinessSetting;