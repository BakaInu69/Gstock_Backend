import { Schema, Document, Error, Types, SchemaTypes } from "mongoose";
export interface PendingStockModel extends Document {
    product_id: Types.ObjectId;
    qty: number;
    status: string;
}
const pendingStockSchema = new Schema(
    {
        product_id: SchemaTypes.ObjectId,
        order_id: SchemaTypes.ObjectId,
        variant_id: SchemaTypes.ObjectId,
        qty: Number,
        status: {
            type: String,
            default: "pending"
        }
    },
    { timestamps: true, minimize: false });


export default pendingStockSchema;
