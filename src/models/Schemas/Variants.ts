import { SchemaTypes, Document, Schema, Types } from "mongoose";
export interface VariantModel extends Document {
    merchant_id: Types.ObjectId;
    product_id: Types.ObjectId;
    status: string;
    option_name: string; //  flavor/size/color
    option_value: string; // bitter/sweet/red
    price: number; // 4
    stock: number; // 1230
    pending_qty: Number;
    sku: string; // ASD-1231
    image: string;
}
const variantSchema = new Schema({
    merchant_id: SchemaTypes.ObjectId,
    product_id: SchemaTypes.ObjectId,
    status: String,
    option_name: String,
    option_value: String,
    price: Number,
    pending_qty: Number,
    stock: Number,
    sku: String,
    image: String,
},
    { timestamps: true, minimize: false });


export default variantSchema;