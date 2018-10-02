import { SchemaTypes, Types, Schema, Document } from "mongoose";

export type EmailModel = Document & {
    type: string,
    title: string,
    content: string
};


const emailSchema = new Schema({
    type: {
        type: String
    },
    title: String,
    content: String

},
    { timestamps: true });




export default emailSchema;