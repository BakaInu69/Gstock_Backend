import { Document, Schema, Types, SchemaTypes } from "mongoose";
export interface CartModel extends Document {
    buyer_id: Types.ObjectId;
    merchantID: Types.ObjectId;
    productID: Types.ObjectId;
    specID: Types.ObjectId;
    qty: number;

}
const cartSchema = new Schema(
    {

        buyer_id: SchemaTypes.ObjectId,
        merchant_id: SchemaTypes.ObjectId,
        variant_id: SchemaTypes.ObjectId,
        product_id: SchemaTypes.ObjectId,
        qty: Number,
    },
    {
        timestamps: true,
        minimize: false
    });


export default cartSchema;



