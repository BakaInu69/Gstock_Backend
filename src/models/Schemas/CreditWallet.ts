import { SchemaTypes, Types, Schema, Document } from "mongoose";

export type CreditWalletModel = Document & {
    buyer_id: Types.ObjectId;
    amount: number;
    memo: string;
    status: string;
};


const creditWalletSchema = new Schema({
    buyer_id: {
        type: SchemaTypes.ObjectId,
    },
    memo: String,
    amount: {
        type: Number,
        default: 0
    },
    status: String
},
    { timestamps: true, minimize: false });




export default creditWalletSchema;