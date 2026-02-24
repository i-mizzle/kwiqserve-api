import mongoose from 'mongoose';
// import bcrypt from 'bcrypt';
// import config from 'config';
import { UserDocument } from "./user.model";
import bcrypt from 'bcrypt';
import config from 'config';

export interface BusinessDocument extends mongoose.Document {
    email: string;
    createdBy?: UserDocument['_id'];
    name: string;
    subdomain: string;
    address: string;
    city: string;
    apiKey: string;
    state: string;
    logo?: string;
    createdAt?: Date;
    updatedAt?: Date;
    comparePassword(candidatePassword: string): Promise<boolean>
}

const BusinessSchema = new mongoose.Schema(
    {
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        name: {
            type: String,
            required: true
        },
        subdomain: {
            type: String,
            required: true,
            unique: true
        },
        address: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            // required: true
        },
        email: {
            type: String,
            // required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        locations: [{
            type: mongoose.Schema.Types.ObjectId   
        }],
        apiKey: {
            type: String,
            // required: true
        },
        logo: {
            type: String
        },
    },
    { timestamps: true }
);

BusinessSchema.pre('save', async function (next: mongoose.HookNextFunction) {
    let store = this as BusinessDocument
    
    // return if a password is not provided for the user
    if(!store.apiKey) {
        return
    }
    // Only hash the password if it's modified or new
    if(!store.isModified('password')) return next();
    
    const salt = await bcrypt.genSalt(parseInt(config.get('saltWorkFactor')));
    const hash = await bcrypt.hashSync(store.apiKey, salt);
    
    store.apiKey = hash
});

// Logging in
BusinessSchema.methods.comparePassword = async function(
    candidatePassword: string
) {
    const store = this as BusinessDocument;
    return bcrypt.compare(candidatePassword, store.apiKey).catch((e) => false);
}

const Business = mongoose.model<BusinessDocument>('Business', BusinessSchema);

export default Business;