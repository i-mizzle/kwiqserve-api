import mongoose from 'mongoose';
import { UserDocument } from './user.model';
import { BusinessDocument } from './business.model';

export interface TableDocument extends mongoose.Document {
    name: string;
    code: string;
    business: BusinessDocument["_id"]
    description?: string;
    deleted: boolean;
    menu: boolean;
    tableQrCode?: string;
    tableUrl?: string;
    createdBy: UserDocument["_id"]
    createdAt?: Date;
    updatedAt?: Date;
}

const TableSchema = new mongoose.Schema(
    {
        business: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Business'
        },
        name: {
            type: String,
            required: true
        },
        code: {
            type: String,
            required: true,
        },
        description: {
            type: String
        },
        menu: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Menu',
            required: true
        },
        deleted: {
            type: Boolean,
            default: false
        },
        tableQrCode: {
            type: String
        },
        tableUrl: {
            type: String,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User'
        }
    },
    { timestamps: true }
);

const Table = mongoose.model<TableDocument>('Table', TableSchema);

export default Table;