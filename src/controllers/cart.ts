import { NextFunction, Request, Response } from "express";
import * as _ from "lodash";
import { Types } from "mongoose";
import { More } from "../_lib/decorators";
import { Config, BuyerModels } from "../types/app";
export class CartController {
    constructor(private config: Config) {
    }
    async buyerGetCart(req: Request, res: Response, next: NextFunction) {
        // a lot complicated lookup and requries optimization
        try {
            const user_id = res.locals.user.id;
            const userCart = await (<BuyerModels>this.config.models).Cart.aggregate([
                {
                    $match: {
                        "buyer_id": Types.ObjectId(user_id),
                    }
                },
                {
                    "$group": {
                        "_id": "$product_id",
                        "merchant_id": { $first: "$merchant_id" },
                        "variants": {
                            "$push": {
                                "variant_id": "$variant_id",
                                "cart_id": "$_id",
                                "qty": "$qty"
                            }
                        }
                    },
                },
                {
                    "$group": {
                        "_id": "$merchant_id",
                        "products": {
                            "$push": {
                                "product_id": "$_id",
                                "variants": "$variants"
                            }
                        },
                    },
                }
            ]).exec();
            const aftPopulateMerchant: any = await this.config.models.User.populate(userCart, { path: "_id", "select": "credential.email store" });
            const aftPopulateProduct: any = await this.config.models.Product.populate(aftPopulateMerchant, { path: "products.product_id", select: "brief pricing" });
            const aftPopulateVariant: any = await this.config.models.Variant.populate(aftPopulateProduct, { path: "products.variants.variant_id" });
            const userCartAftOrganize = aftPopulateVariant.map(
                merchant => {
                    const productsByMerchant = merchant.products;
                    const products = productsByMerchant
                        .filter(product => product.product_id)
                        .map(product => {
                            const {
                                qty,
                                variant_id,
                                cart_id
                            } = product["variants"][0];
                            if (!variant_id) {
                                delete product["variants"];
                                return {
                                    ...product,
                                    cart_id,
                                    qty,
                                    productTotal: product.product_id.brief.price * qty
                                };
                            }
                            const variants = product.variants
                                .filter(v => v.variant_id || !v.qty)
                                .map(v => {
                                    v["variantTotal"] = v.variant_id.price * v.qty;
                                    return v;
                                });
                            if (variants.length) {
                                return {
                                    ...product,
                                    variants,
                                    productTotal: variants.reduce((a, b) => ({ variantTotal: a.variantTotal + b.variantTotal })).variantTotal
                                };
                            }
                        });
                    if (products.length) {
                        return {
                            merchant: merchant._id,
                            products,
                            storeTotal: products.reduce((a, b) => ({ productTotal: a.productTotal + b.productTotal })).productTotal
                        };
                    } else {
                        console.log("the merchant is ", merchant._id);
                    }
                })
                .filter(c => c);
            return res.status(200).send(
                { cart: userCartAftOrganize }
            );
        } catch (error) {
            console.log("getting cart error", error);
            return next(error);
        }
    }
    @More()
    async buyerAddProductToCart(req: Request, res: Response, next: NextFunction) {
        const { product_id, variant_id, qty } = req.body;
        const user_id = res.locals.user.id;
        const searchBody = {
            buyer_id: Types.ObjectId(user_id),
            product_id: Types.ObjectId(product_id),
        };
        try {
            const productFound = await this.config.models.Product.findOne(
                {
                    _id: Types.ObjectId(product_id),
                    is_active: true,
                    status: "Approved"
                }
            );
            if (!productFound) return res.status(400).send({ message: "Product is not found." });
            let variantFound;
            if (variant_id) {
                searchBody["variant_id"] = Types.ObjectId(variant_id);
                variantFound = await this.config.models.Variant.findById(variant_id);
                if (!variantFound) return res.status(400).send({ message: "No such variant on sale." });
            } else {
                variantFound = await this.config.models.Variant.findOne({ product_id: Types.ObjectId(product_id) });
                if (variantFound && !variant_id) return res.status(400).send({ message: "Please select a variant to put in cart." });
            }
            //  Check if buyer has the product in cart.
            const productInUserCartFound = await (<BuyerModels>this.config.models).Cart.findOne(searchBody);
            if (!productInUserCartFound) {
                // If does not exist, push the product into cart.
                searchBody["qty"] = qty;
                searchBody["merchant_id"] = productFound.merchant_id;
                const result = await new (<BuyerModels>this.config.models).Cart(searchBody).save();
                return res.status(201).send({ message: "Added to cart." });
            } else {
                // Check if buyer is buying a base product with no variant.
                const maximumStockAvailable = variantFound ? variantFound.stock : productFound.stock.qty;
                // If Found, check if quantity exceed existing stock.
                if ((productInUserCartFound.qty + qty || 1) > maximumStockAvailable) return res.status(400).send({ message: "Insufficient stock" });
                productInUserCartFound.qty += qty || 1;
                const result = await productInUserCartFound.save();
                return res.status(201).send({ message: "Added to cart." });
            }
        } catch (error) {
            return next(error);
        }
    }
    async  buyerUpdateProductQtyInCart(req: Request, res: Response, next: NextFunction) {
        const {
            product_id,
            variant_id,
            qty
        } = req.body;
        const user_id = res.locals.user.id;
        const result = await (<BuyerModels>this.config.models).Cart.findOneAndUpdate(
            {
                buyer_id: Types.ObjectId(user_id),
                product_id: Types.ObjectId(product_id),
                variant_id: Types.ObjectId(variant_id)
            },
            { qty });
        if (!result) { return res.status(404).send({ message: "No such product or insufficient quantity." }); }
        return res.status(201).send({ message: "Quantity updated." });
    }
    async  buyerRemoveProductFromCart(req: Request, res: Response, next: NextFunction) {
        const { cart_id } = req.params;
        const result = await (<BuyerModels>this.config.models).Cart.findOneAndRemove({
            _id: Types.ObjectId(cart_id),
            buyer_id: Types.ObjectId(res.locals.user.id)
        });
        if (!result) { return res.status(400).send({ message: "No such product or insufficient quantity." }); }
        return res.status(201).send({ message: "Removed from cart." });
    }
}