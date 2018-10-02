import { Document, Schema, SchemaTypes, Types } from "mongoose";
interface PayPalSuccess {
    intent: string;
    payerID: string;
    paymentID: string;
    paymentToken: string;
    payload: string;
}
export interface OrderModel extends Document {
    buyer_id: Types.ObjectId;
    merchant_id: Types.ObjectId;
    memo: string;
    status: string;
    commission_status: string;
    delivery: {
        address: string,
        unit_no: string,
        postal_code: string,
        shipping_fee: number,
        shipping_type: string,
        contact_no: string,
        recepient: string,
        shipment_id: string,
    };
    promotions: [{
        _id: Types.ObjectId
    }];
    products: [
        {
            _id: Types.ObjectId;
            comment_id: Types.ObjectId;
            purchase: {
                product_total_ap: number,
                product_total_bp: number,
                commission: number,
                commission_amount: number,
                reward_pts: number
            },
            product: {
                brief: {
                    name: string,
                    short_description: string,
                    price: number,
                    stock: number,
                    category: string,
                    images: Array<string>,
                    discount: boolean,
                },
                pricing: {
                    discount_rate: Number
                }
            },
            variants: [
                {
                    _id: Types.ObjectId,
                    sku: string,
                    stock: number,
                    price: number,
                    option_name: string,
                    option_value: string,
                    status: string,
                    order_qty: number,
                    commission: number,
                    reward_pts: number
                }
            ],
        }
    ];
    paypal: PayPalSuccess;
    total: {
        store: number,
        commission: number,
        reward_pts: number,
        reward_rate: number,
    };
    orderDate: Date;
    orderStatus: string;
    purchasedFrom: string;
    placedFromIP: string;
    customerName: string;
    email: string;
    customerGroup: string;
    prefix: string;
    billingAdd: string;
    giftOpt: {
        from: string,
        to: string,
        msg: string
    };
    creditMemos: string;
    commentsHistory: string;
    hasUserUsedPromo: (userId, promotionId) => boolean;
}


const orderSchema = new Schema({
    buyer_id: {
        type: SchemaTypes.ObjectId,
        ref: "User",
        required: true
    },
    merchant_id: {
        type: SchemaTypes.ObjectId,
        ref: "User",
        required: true
    },
    memo: String,
    status: {
        type: String,
        index: true,
        default: "Pending"
    },
    commission_status: {
        type: String,
        default: "Hold"
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
    products: [
        {
            _id: SchemaTypes.ObjectId,
            comment_id: SchemaTypes.ObjectId,
            purchase: {
                product_total_bp: Number,
                commission: Number,
                commission_amount: Number,
                reward_pts: Number
            },
            product: {
                _id: {
                    type: SchemaTypes.ObjectId,
                    required: true
                },
                brief: {
                    name: String,
                    short_description: String,
                    price: Number,
                    stock: Number,
                    category: String,
                    images: [String],
                    discount: Boolean,
                },
                pricing: {
                    discount_rate: {
                        type: Number,
                        default: 0
                    }
                }
            },
            variants: [{
                _id: SchemaTypes.ObjectId,
                sku: String,
                stock: Number,
                price: Number,
                option_name: String,
                option_value: String,
                status: String,
                order_qty: Number,
                commission: Number,
                reward_pts: Number
            }],
        }
    ],
    promotions: [{
        _id: {
            type: SchemaTypes.ObjectId,
            ref: "Promotion"
        }
    }],
    paypal: {
        intent: String,
        payerID: String,
        paymentID: String,
        paymentToken: String,
        payload: String
    },
    free_shipping: Boolean,
    total: {
        store_bp: Number,
        store_ap: Number,
        commission: Number,
        reward_pts: Number,
    },
    purchasedFrom: String,
    placedFromIP: String,
    customerGroup: String,
    prefix: String,
    billingAdd: String,
    giftOpt: {
        from: String,
        to: String,
        msg: String
    },
    creditMemos: String,
    commentsHistory: String
},
    { timestamps: true });

orderSchema.statics.hasUserUsedPromo = async function(userId, promotionId) {
    try {
        await this.findOne({
            buyer_id: userId,
            "promotions._id": promotionId
        });
      } catch (error) {
        throw(error);
      }
};
export default orderSchema;