import mongoose from 'mongoose';
import { UserDocument } from "./user.model";
import { BusinessDocument } from './business.model';

export interface CustomerDocument extends mongoose.Document {
    business: BusinessDocument['_id']
    name: string;
    email: string;
    phone: string;
    address?: {
        address: string
        city: string
        state: string
        description: string
    }
    createdAt?: Date;
    updatedAt?: Date;
}

const CustomerSchema = new mongoose.Schema(
    {
        business: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Business',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        address: {
            address: {
                type: String,
            },
            city: {
                type: String
            },
            state: {
                type: String
            },
            description: {
                type: String
            },
        }
        
    },
    { timestamps: true }
);

const Customer = mongoose.model<CustomerDocument>('Customer', CustomerSchema);

export default Customer;