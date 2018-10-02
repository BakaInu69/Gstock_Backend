import { Schema, Types, Document, Error, SchemaTypes } from "mongoose";

export interface CommentModel extends Document {
    order_id: Types.ObjectId;
    product_id: Types.ObjectId;
    buyer_id: Types.ObjectId;
    comment: string;
    rating: number;
}

const commentSchema = new Schema(
    {
        order_id: SchemaTypes.ObjectId,
        product_id: SchemaTypes.ObjectId,
        buyer_id: SchemaTypes.ObjectId,
        comment: String,
        rating: Number,
    },
    { timestamps: true, minimize: false});



export default commentSchema;



