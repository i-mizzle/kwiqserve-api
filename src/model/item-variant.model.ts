import mongoose from 'mongoose';
import { UserDocument } from "./user.model";
import { ItemDocument } from './item.model';

export interface Recipe {
    item: ItemDocument['_id'],
    measure: number
}

export interface ItemVariantDocument extends mongoose.Document {
    createdBy?: UserDocument['_id'];
    item: ItemDocument['_id'];
    name: string;
    barcode?: string
    sku: string;
    description: string;
    saleUnit: string;
    currentStock: number;
    recipe: Recipe[]
    deleted: boolean
    noStock: boolean
    hasInHouseRecipe: boolean
    createdAt?: Date;
    updatedAt?: Date;
}

const ItemVariantSchema = new mongoose.Schema(
    {
        createdBy: {
            type: mongoose.Schema.Types.ObjectId, ref: 'User',
        },
        item: {
            type: mongoose.Schema.Types.ObjectId, ref: 'Item'
        },
        name: {
            type: String,
            required: true
        },
        variantType: {
            type: String, // type/basis of the variation eg: color, size etc.
        },
        barcode: {
            type: String
        },
        sku: {
            type: String,
            required: true
        },
        description: {
            type: String
        },
        saleUnit: {
            type: String,
            required: true
        },
        lowStockAlertCount: {
            type: Number,
            required: true
        },
        currentStock: {
            type: Number,
            default: 0
        },
        deleted: {
            type: Boolean,
            default: false
        },
        hasInHouseRecipe: {
            type: Boolean,
            default: false
        },
        noStock: {
            type: Boolean,
            default: false
        },
        recipe: [
            {
                item: {
                    type: mongoose.Schema.Types.ObjectId, ref: 'Item',
                    // required: true
                },
                measure: {
                    type: Number,
                    // required: true
                }
            }
        ]
    },
    { timestamps: true }
);

const ItemVariant = mongoose.model<ItemVariantDocument>('ItemVariant', ItemVariantSchema);

export default ItemVariant;