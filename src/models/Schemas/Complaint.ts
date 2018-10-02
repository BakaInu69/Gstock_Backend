import { Schema, Types, Document, Error, SchemaTypes } from "mongoose";

export interface ComplaintModel extends Document {
    order_id: Types.ObjectId;
    product_id: Types.ObjectId;
    buyer_id: Types.ObjectId;
    comment: string;
    reply: [{
        comment: string,
        role: string,
        date: Date,
    }];
}

const complaintSchema = new Schema(
    {
        order_id: SchemaTypes.ObjectId,
        product_id: SchemaTypes.ObjectId,
        buyer_id: SchemaTypes.ObjectId,
        comment: String,
        reply: [{
            comment: String,
            role: String,
            date: SchemaTypes.Date,
        }]
    },
    {
        timestamps: true,
        minimize: false
    });



export default complaintSchema;



