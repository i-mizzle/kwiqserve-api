import mongoose from 'mongoose';
import { UserDocument } from './user.model';
import { BusinessDocument } from './business.model';

export interface BankAccountDocument extends mongoose.Document {
    business: BusinessDocument['_id']
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    createdBy: UserDocument["_id"];
    paystackAccountId?: string    
    paystackRecipientCode?: string
    paystackIntegrationId?: string
    createdAt?: Date;
    updatedAt?: Date;
}

const BankAccountSchema = new mongoose.Schema(
    {
        business: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Business'
        },
        bankCode: {
            type: String,
            required: true
        },
        bankName: {
            type: String,
            required: true
        },
        accountNumber: {
            type: String,
            required: true
        },
        accountName: {
            type: String,
            required: true
        },
        createdBy: {
            type:  mongoose.Schema.Types.ObjectId, 
            ref: 'User',
            required: true
        },
        paystackAccountId: {
            type: String
        },
        paystackRecipientCode: {
            type: String
        },
        paystackIntegrationId: {
            type: String
        },
        deleted: {
            type: Boolean,
            default: false
        },
        flwRequestError: {

        },
    },
    { timestamps: true }
);

const BankAccount = mongoose.model<BankAccountDocument>('BankAccount', BankAccountSchema);

export default BankAccount;