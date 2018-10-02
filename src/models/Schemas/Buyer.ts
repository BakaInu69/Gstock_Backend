import { SchemaTypes, Schema, Document, Error } from "mongoose";
import * as mongoosePaginate from "mongoose-paginate";
export interface BuyerModel extends Document {
    profile: {
        gender: string
    };
    carted: [{
        qty: number;
    }];
}
const buyerSchema = new Schema({
    profile: {
        gender: String,
        firstName: String,
        lastName: String,
        middleName: String,
        prefix: String,
        suffix: String,
    },
    reward_pts: Number
});

buyerSchema.plugin(mongoosePaginate);
export default buyerSchema;