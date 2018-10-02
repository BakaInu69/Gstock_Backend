import { SchemaTypes, Types, Schema, Document } from "mongoose";

export type RewardPtsModel = Document & {
    buyer_id: Types.ObjectId;
    order_id: Types.ObjectId;
    product_id: Types.ObjectId;
    pts: number;
    from: string;
    delivery: {
        address: string,
        unit_no: string,
        postal_code: string,
        contact_no: string,
        recepient: string,
        shipping_fee: number,
        shipping_type: string,
        shipment_id: string,
    },
    status: string
};


const rewardPtsSchema = new Schema({
    buyer_id: SchemaTypes.ObjectId,
    order_id: SchemaTypes.ObjectId,
    product_id: SchemaTypes.ObjectId,
    pts: {
        type: Number,
        default: 0
    },
    from: {
        type: String,
        default: "bp"
    },
    delivery: {
        address: String,
        unit_no: String,
        postal_code: String,
        contact_no: String,
        recepient: String,
        shipping_fee: Number,
        shipping_type: String,
        shipment_id: String,
    },
    status: String
},
    { timestamps: true, minimize: false });




export default rewardPtsSchema;