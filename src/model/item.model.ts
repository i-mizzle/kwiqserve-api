// const itemInput = {
//     storeItem: '',
//     measure: ''
// }

// const itemVariant = {
//     sku: '',
//     name: '',
//     description: '',
//     saleUnit: '',
//     lowStockAlertCount: '',
//     // salePrice: '',
//     input: [itemInput],
//     currentStock: 0,
//     // id: nanoid(10)
// }
  
// const item = {
//     sku: '',
//     name: '',
//     category: '',
//     type: 'sale', // sale or store
//     variants: [
//       itemVariant
//     ],
// }

// const storeItem = {
//     sku: '',
//     name: '',
//     category: '',
//     description: '',
//     lowStockAlertCount: '',
//     type: 'store',
//     stockUnit: '',
//     currentStock: 0
// }

import mongoose from 'mongoose';
import { UserDocument } from "./user.model";
import { CategoryDocument } from './category.model';
import { ItemVariantDocument } from './item-variant.model';
import { BusinessDocument } from './business.model';

export interface ItemDocument extends mongoose.Document {
    createdBy?: UserDocument['_id'];
    business: BusinessDocument['_id'];
    sku: string
    name: string
    category: CategoryDocument['_id'][],
    description: string
    lowStockAlertCount: number
    type: string
    barcodes?: string[],
    inventoryType: string
    deleted?: boolean
    stockUnit?: string
    currentStock: number
    variants?: ItemVariantDocument[]
    coverImage?: string
    createdAt?: Date;
    updatedAt?: Date;
}

const ItemSchema = new mongoose.Schema(
    {
        createdBy: {
            type: mongoose.Schema.Types.ObjectId, ref: 'User',
        },
        business: {
            type: mongoose.Schema.Types.ObjectId, ref: 'Business',
            required: true
        },
        category: [{
            type: mongoose.Schema.Types.ObjectId, ref: 'Category'
        }],
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
        },
        inventoryType: {
            type: String,
            enum: ['stock', 'pre-order']
        },
        lowStockAlertCount: {
            type: Number,
            default: 0
        },
        type: {
            type: String,
            enum: ['store', 'sale'],
            default: 'store'
        },
        stockUnit: {
            type: String
        },
        sku: {
            type: String,
        },
        barcodes: [],
        deleted: {
            type: Boolean,
            default: false
        },
        variants: [
            {
                type: mongoose.Schema.Types.ObjectId, 
                ref: 'ItemVariant'
            }
        ],
        currentStock: {
            type: Number,
            default: 0
        },
        coverImage: {
            type: String
        }
    },
    { timestamps: true }
);

const Item = mongoose.model<ItemDocument>('Item', ItemSchema);

export default Item;