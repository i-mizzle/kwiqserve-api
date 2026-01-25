import mongoose from 'mongoose';
import { UserDocument } from "./user.model";
import { ItemVariantDocument } from './item-variant.model';
import { MenuDocument } from './menu.model';
import { ItemDocument } from './item.model';
import { BusinessDocument } from './business.model';
import { TableDocument } from './table.model';
import { CustomerDocument } from './customer.model';
// import { CartDocument } from './cart.model';

export interface OrderItem {
    item: ItemVariantDocument['_id']
    parentItem: ItemDocument['_id']
    quantity: number
    price: number
}

export interface OrderDocument extends mongoose.Document {
    createdBy?: UserDocument['_id'];
    business: BusinessDocument['_id'];
    table: TableDocument['_id'];
    orderRef: string;
    // cart?: CartDocument['_id'];
    alias: string;
    source: string;
    items: OrderItem[];
    status: string;
    statusHistory?: {
        status?: string,
        timeStamp?: Date
        note?: string
    }[]
    processingTime?: number
    total: number;
    vat: number;
    sourceMenu: MenuDocument['_id']
    paymentStatus: string;
    customer?: CustomerDocument["_id"]
    paymentMethod?: string
    deliveryType?: string
    pickupOutlet?: string
    createdAt?: Date;
    updatedAt?: Date;
}

const OrderSchema = new mongoose.Schema(
    {
        createdBy: {
            type: mongoose.Schema.Types.ObjectId, ref: 'User'
        },
        alias: {
            type: String,
            required: true
        },
        table: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Table', 
            required: true
        },
        orderRef: {
            type: String,
            unique: true,
            required: true
        },
        // cart: {
        //     type: mongoose.Schema.Types.ObjectId, 
        //     ref: 'Cart'
        // },
        source: {
            type: String,
            enum: ['online', 'onsite'],
            default: 'onsite'
        },
        sourceMenu: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Menu',
            required: true
        },
        business: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Business',
            required: true
        },
        items: [
            {
                item: {
                    type: mongoose.Schema.Types.ObjectId, 
                    ref: 'ItemVariant',
                    required: true
                },
                parentItem: {
                    type: mongoose.Schema.Types.ObjectId, 
                    ref: 'Item',
                },
                displayName: {
                    type: String,
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true
                },
                price: { 
                    type: Number,
                    required: true
                }
            }
        ],
        total: {
            type: Number,
            required: true,
            default: 0
        },
        vat: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed', 'preparing_order', 'out_for_delivery', 'delivered', 'cancelled'],
            default: 'in_progress',
            required: true
        },
        statusHistory: [
            {
                status: {
                    type: String,
                    enum: ['pending', 'in_progress', 'completed', 'preparing_order', 'out_for_delivery', 'delivered', 'cancelled'],
                    default: 'in_progress',
                },
                note: {
                    type: String,
                },
                timeStamp: {
                    type: Date,
                }
            }
        ],
        processingTime: {
            type: Number // time in minutes between the statuses IN_PROGRESS and COMPLETED
        },
        paymentStatus: {
            type: String,
            enum: ['unpaid', 'part_paid', 'paid'],
            default: 'unpaid',
            required: true
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Customer',
        },
        paymentMethod: {
            type: String,
            enum: ['cash_on_delivery', 'pos_on_delivery', 'cash', 'online'],
        },
        deliveryType: {
            type: String,
            enum: ['doorstep', 'pickup'],
        },
        pickupOutlet: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Business',
        },
    },
    { timestamps: true }
);

const Order = mongoose.model<OrderDocument>('Order', OrderSchema);

export default Order;