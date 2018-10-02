import { SchemaTypes, Types, Schema, Document } from "mongoose";

export type RewardProductModel = Document & {
    name: string;
    pts: number;
    stock: number;
    image: string;
    description: string;
    expire: Date;
    status: string;
};


const rewardProductSchema = new Schema({
    name: String,
    pts: Number,
    stock: Number,
    image: String,
    description: String,
    expire: Date,
    status: String
},
    { timestamps: true, minimize: false });
export default rewardProductSchema;