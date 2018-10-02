import { Document, Schema, Types, SchemaTypes } from "mongoose";

export interface PromotionModel extends Document {
    name: string;
    detail: string;
    promo_code: string;
    start: Date;
    end: Date;
    status: string;
    target: [Types.ObjectId];
    kind: string;
    promo_type: string;
    value: string;
    min_order: boolean;
    min_value: number;
    limit: number;
    first_order: boolean;
}
const promotionSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        detail: {
            type: String,
            required: true
        },
        start: {
            type: String,
            required: true
        },
        end: {
            type: Date,
            required: true
        },
        promo_code: {
            type: String,
            required: true
        },
        value: {
            type: String,
            required: true
        },
        promo_type: {
            type: String,
            required: true
        },
        kind: {
            type: String,
            required: true
        },
        status: {
            type: String,
            default: "Inactive"
        },
        target: [SchemaTypes.ObjectId],
        first_order: {
            type: Boolean,
            default: false
        },
        min_order: {
            type: Boolean,
            default: false
        },
        min_value: {
            type: Number,
            default: 0
        },
        used: {
            type: Number,
            default: 0
        },
        limit: Number, // 0 = no limit , n = no. of use limits
    },
    { timestamps: true, minimize: false });

promotionSchema.statics.isFirstOrder = function(promotion) {
    return promotion.first_order;
};
export default promotionSchema;
