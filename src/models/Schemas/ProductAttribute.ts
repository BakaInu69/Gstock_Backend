import { Document, Schema, SchemaTypes, Types } from "mongoose";

export interface ProductAttributeModel extends Document {
    "name": string;
    "value": [string];
    "cateogry": [Types.ObjectId];
    "variant": boolean;
}



const productAttributeSchema = new Schema(
    {
        "name": {
            type: String,
            unique: true
        },
        "variant": {
            type: Boolean,
            default: false
        },
        "value": [String],
        "category": [{
            type: SchemaTypes.ObjectId,
            ref: "Category"
        }]
    },
    { timestamps: true, minimize: false }
);

export default productAttributeSchema;