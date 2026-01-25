import mongoose from 'mongoose';
import { UserDocument } from "./user.model";
import { ItemVariantDocument } from './item-variant.model';
import { ItemDocument } from './item.model';
import { CategoryDocument } from './category.model';
import { BusinessDocument } from './business.model';

export interface MenuItem {
    item: ItemVariantDocument['_id']
    parentItem: ItemDocument['_id']
    parentItemCategory: CategoryDocument['_id']
    displayName: string
    price: number
}

export interface MenuDocument extends mongoose.Document {
    createdBy: UserDocument['_id'];
    business: BusinessDocument['_id']
    name: string;
    description: string
    eCommerceMenu: boolean
    items: MenuItem[];
    deleted: boolean
    createdAt: Date;
    updatedAt: Date;
}

const MenuSchema = new mongoose.Schema(
    {
        createdBy: {
            type: mongoose.Schema.Types.ObjectId, ref: 'User'
        },
        business: {
            type: mongoose.Schema.Types.ObjectId, ref: 'Business',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        description: {
            type: String
        },
        eCommerceMenu: {
            type: Boolean,
            default: false
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
                },
                fixedPricing: {
                    type: Boolean,
                    default: true
                },
                price: {
                    type: Number,
                }
            }
        ],
        deleted: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

const Menu = mongoose.model<MenuDocument>('Menu', MenuSchema);

export default Menu;