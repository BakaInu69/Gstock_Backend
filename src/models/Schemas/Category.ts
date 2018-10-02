import { Schema, Types, Document, Error, SchemaTypes } from "mongoose";

export interface CategoryModel extends Document {
    path: string;
    commission: number;
    attributes: [Types.ObjectId];

}

const categorySchema = new Schema(
    {
        path: {
            type: String,
            index: { unique: true }
        },
        commission: {
            type: Number,
            default: 1
        },
        attributes: [{
            type: SchemaTypes.ObjectId,
            ref: "ProductAttribute"
        }]
    },
    {
        timestamps: true,
        minimize: false
    });



export default categorySchema;



