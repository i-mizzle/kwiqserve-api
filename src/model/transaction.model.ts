import mongoose from "mongoose";
import { UserDocument } from "./user.model";
import { OrderDocument } from "./order.model";
import { BusinessDocument } from "./business.model";
import { CartDocument } from "./cart.model";

export interface TransactionDocument extends mongoose.Document {
  createdBy?: UserDocument["_id"];
  order?: OrderDocument["_id"];
  cart?: CartDocument["_id"];
  business: BusinessDocument["_id"];
  transactionReference: string;
  receivingChannel?: any;
  amount: number;
  fees?: number;
  channel: string;
  status?: string;
  processor: string;
  processorTransactionId?: string
  processorData?: object
  createdAt?: Date;
  updatedAt?: Date;
}

const TransactionSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Business',
      required: true
    },
    transactionReference: { 
        type: String,
        unique: true,
        required: true,
        immutable: true
    },
    processorTransactionId: {
      type: String
    },
    order: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Order',
    },
    cart: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Cart',
    },
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
    },
    userType: { 
        type: String, 
    },
    amount: {
      type: Number,
      required: true
    },
    fees: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['pending', 'successful', 'failed'],
      default: 'pending',
      required: true
    },
    receivingChannel: {},
    channel: { 
        type: String,
        enum: ['cash', 'pos', 'transfer', 'web'],
        required: true
    },
    processor: {
        type: String,
        enum: ['flutterwave', 'paystack', 'cashier'],
        default: 'cashier'
    },
    processorData: {},
  },
  { timestamps: true }
);

const Transaction = mongoose.model<TransactionDocument>("Transaction", TransactionSchema);

export default Transaction;