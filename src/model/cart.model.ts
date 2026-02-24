import mongoose from 'mongoose';
import { OrderItem } from './order.model';
import { ItemDocument } from './item.model';
import { CategoryDocument } from './category.model';
import { BusinessDocument } from './business.model';
import { TableDocument } from './table.model';

interface CartItem extends OrderItem {
    parentItem: ItemDocument['_id']
    parentItemCategories: CategoryDocument['_id'][]
}

export interface CartDocument extends mongoose.Document {
    clientId: string
    business: BusinessDocument['_id']
    table: TableDocument['_id']
    items: CartItem[];
    total?: number;
    checkoutStatus?: string,
    deleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

const CartSchema = new mongoose.Schema(
    {
        clientId: {
            type: String,
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
                    type: mongoose.Schema.Types.ObjectId, ref: 'ItemVariant',
                    required: true
                },
                parentItem: {
                    type: mongoose.Schema.Types.ObjectId, ref: 'Item',
                    required: true
                },
                parentItemCategories: [{
                    type: mongoose.Schema.Types.ObjectId, ref: 'Category',
                    required: true
                }],
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
            default: 0
        },
        deleted: {
            type: Boolean,
            default: false
        },
        table: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Table', 
            required: true
        },
        // sourceMenu: {
        //     type: mongoose.Schema.Types.ObjectId,
        //     required: true
        // },
        checkoutStatus: {
            type: String,
            enum: ['pending', 'checked_out'],
            default: 'pending',
            required: true
        }
    },
    { timestamps: true }
);

const Cart = mongoose.model<CartDocument>('Cart', CartSchema);

export default Cart;