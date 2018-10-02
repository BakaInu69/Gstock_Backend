
import { SchemaTypes, Document, Schema, Types } from "mongoose";
// import * as mongoosePaginate from "mongoose-paginate";

export interface AttributeModel extends Document {
    title: string; // "options"
    name: string; // "color"
    value: [string]; // "red,green"
}

const attributeSchema = new Schema({
    title: String, // "options"
    name: String, // "color"
    value: [String], // "red,"
},
    {
        timestamps: true,
        minimize: false
    });


export default attributeSchema;
