import { SchemaTypes, Document, Schema, Types } from "mongoose";
import * as mongoosePaginate from "mongoose-paginate";

export interface ProductModel extends Document {
    merchant_id: Types.ObjectId;
    category_id: Types.ObjectId;
    status: string;
    is_active: boolean;
    visibility: string;
    image: string;
    brief: {
        name: string;
        short_description: string;
        price: number;
        stock: number;
        discount: boolean;
        category: string;
        images: Array<string>
    };
    detail: {
        long_description: string,
        product_brand: string,
        barcode: string;
        sku: string;
    };
    pricing: {
        discount_rate: number;
        discount_price: number;
        final_price: number
        min_price: number,
        max_price: number,
    };
    stock: {
        pending: [
            {
                order_id: Types.ObjectId,
                merchant_id: Types.ObjectId,
                qty: number
            }
        ],
        qty: number,
        min_qty: number,
    };
    getApprovedProductByMerchant: (merchantId: Types.ObjectId) => ProductModel;
}


export const validatorGroups = {
    unitPriceMustBeGreaterThanDiscountPrice() {
        return this.uP > this.dP;
    }
};
const productSchema = new Schema({
    merchant_id: SchemaTypes.ObjectId,
    category_id: {
        type: SchemaTypes.ObjectId,
        ref: "Category"
    },
    is_active: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        default: "Pending"
    },
    visibility: String,
    image: String,
    brief: {
        name: String,
        short_description: String,
        price: Number,
        stock: Number,
        discount: {
            type: Boolean,
            default: false
        },
        category: {
            type: String,
            index: true,
        },
        attributes: [{
            name: String,
            value: String
        }],
        images: [String],
    },
    detail: {
        long_description: String,
        barcode: String,
        sku: String,
        product_brand: String,
    },
    pricing: {
        discount_rate: Number,
        discount_price: Number,
        final_price: Number,
        min_price: Number,
        max_price: Number,
    },
    stock: {
        qty: Number,
        min_qty: Number,
    },
}, { timestamps: true, minimize: false });


productSchema.statics.getApprovedProductByMerchant = async function(merchantId: Types.ObjectId) {
    try {
        return await this.find({ merchant_id: merchantId, status: "Approved" }).select("brief pricing");
    } catch (error) {
        throw(error);
    }
};
productSchema.plugin(mongoosePaginate);
export default productSchema;