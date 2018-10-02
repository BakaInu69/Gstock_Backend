import { Types, Model, Aggregate } from "mongoose";
import { CartModel } from "../models/Schemas/Cart";
import { VariantModel } from "../models/Schemas/Variants";
import { Store, Profile } from "../models/Schemas/User";
export interface ProductInCartGroupByMerchantAndVariant {
    product_id: Types.ObjectId;
    store_total: number;
    merchant: {
        _id: {
            credential: {
                email
            }
        },
        store: Store,
        profile: Profile
    };
    products: [{
        product: {
            detail: {

            },
            brief: {

            }
        },
        variants: [{
            variant_id?: Types.ObjectId,
            variant?: VariantModel,
            qty: number
            subtotal: number;
        }],
        total: number;
    }];
}
export class CartRepository {
    Cart: Model<CartModel>;
    constructor(private CartModel) {
        this.Cart = CartModel;
    }
    loadProductInCartGroupByMerchantAndVariant(userId: string) {
        return this.Cart.aggregate([
            {
                $match: {
                    "buyer_id": Types.ObjectId(userId),
                }
            },
                       {
                $lookup:
                {
                  from: "users",
                  localField: "merchant_id",
                  foreignField: "_id",
                  as: "merchant"
                }
            },
            {
                $lookup:
                {
                  from: "variants",
                  localField: "variant_id",
                  foreignField: "_id",
                  as: "variant"
                }
            },
            {
                $lookup:
                {
                  from: "products",
                  localField: "product_id",
                  foreignField: "_id",
                  as: "product"
                }
            },
            {
                $unwind: {
                    path: "$variant",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: "$merchant"
            },
            {
                $unwind: "$product"
            },
            {
                $project: {
                  "merchant": 1,
                  "merchant_id": 1,
                  "product_id": 1,
                  "product": 1,
                  "qty": 1,
                  "variant": {$ifNull: ["$variant", {"price": "$product.brief.price"}]}
                }
            },
            {
                $group: {
                    "_id": "$product_id",
                    "merchant_id": { $first: "$merchant_id" },
                    "merchant": { $first: "$merchant" },
                    "product": { $first: "$product" },
                    "variants": {
                        "$push": {
                            "variant_id": "$variant_id",
                            "variant":   "$variant",
                            "cart_id": "$_id",
                            "qty": "$qty",
                            "subtotal": {$multiply: ["$qty", "$variant.price"]}
                        }
                    }
                },
            },
            {
                $unwind: "$variants"
            },
            {
                $group: {
                    "_id": "$product._id",
                    "merchant_id": { $first: "$merchant_id" },
                    "merchant": { $first: "$merchant" },
                    "product": { $first: "$product" },
                    "variants": {
                        "$push": "$variants"
                    },
                    "total": {$sum: "$variants.subtotal"}
                },
            },
            {
                $group: {
                    "_id": "$merchant_id",
                    "merchant_id": { $first: "$merchant_id" },
                    "merchant": { $first: "$merchant" },
                    "product": { $first: "$product" },
                    "store_total": {$sum: "$total"},
                    "products": {
                        "$push": {
                            "product_id": "$_id",
                            "product": "$product",
                            "variants": "$variants",
                            "total": "$total"
                        }
                    },
                },
            },

            {
                $project: {
                    "total": 1,
                    "merchant.credential.email": 1,
                    "merchant.store": 1,
                    "products.product._id": 1,
                    "merchant.profile": 1,
                    "products.product.detail": 1,
                    "products.total": 1,
                    "store_total": 1,
                    "brief": "$products.product.brief",
                    "products.variants": 1,
                    "merchant._id": 1,
                }
              },
        ]);

    }
}