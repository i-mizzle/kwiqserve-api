import mongoose from 'mongoose';
import { UserDocument } from './user.model';
import { BusinessDocument } from './business.model';
import { TransactionDocument } from './transaction.model';
import { boolean } from 'yup/lib/locale';

export interface PendingFeeDocument extends mongoose.Document {
    business: BusinessDocument["_id"]
    amount: number;
    transaction: TransactionDocument['_id'];
    deleted?: boolean
    settled?: boolean
    createdAt?: Date;
    updatedAt?: Date;
}

const PendingFeeSchema = new mongoose.Schema(
    {
        business: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Business'
        },
        amount: {
            type: String,
            required: true
        },
        transaction: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Transaction'
        },
        settled: {
            type: Boolean,
            default: false
        },
        deleted: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

const PendingFee = mongoose.model<PendingFeeDocument>('PendingFee', PendingFeeSchema);

export default PendingFee;