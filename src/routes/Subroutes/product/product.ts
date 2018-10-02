"use strict";
import { Router } from "express";

import {
    categoryController,
    ProductController,
    promotionController,
    UserController,
    attributeController,
    rewardProductController
} from "../../../controllers";
import { check, checkSchema } from "express-validator/check";
import { validationResponse } from "../../../middleware/validationRes";
import * as _ from "lodash";
/**
 * Product app routes.
 */
export default (config) => {
        const { userPassport  } = config.passport;
        const {
            getAllCategory
        } = categoryController(config);
        const productCtrl = new ProductController(config);
        const {
            getApprovedProducts,
            getSingleProductDetail,
            getProductsVariants,
            getRelevantProductFromStore
        } = _.bindAll(productCtrl, Object.getOwnPropertyNames(ProductController.prototype));
        const {
            getRewardProduct
        } = rewardProductController(config);
        const {
            getUIFloors,
            getBrands,
            getAdsLink
        } = attributeController(config);
        const userCtrl = new UserController(config);
        const {
            getProductsInStore
        } = _.bindAll(userCtrl, Object.getOwnPropertyNames(UserController.prototype));
        const {
            verifyPromoCode
        } = promotionController(config);
        return Router()
            .get("/list", getApprovedProducts())
            .get("/product",
                checkSchema({
                    product_id: {
                        in: "query",
                        exists: { errorMessage: "Product ID is required." }
                    }
                }),
                validationResponse,
                getSingleProductDetail("buyer"))
            .get("/category", getAllCategory)
            .get("/variants/:id", getProductsVariants)
            .get("/ui/floor", getUIFloors)
            .get("/ui/home/brands", getBrands)
            .get("/ui/home/ad-links", getAdsLink)
            .get("/store", getProductsInStore)
            .get("/store/relevant", getRelevantProductFromStore)
            .get("/promo/verify",
                userPassport.isJWTValid.bind(userPassport),
                checkSchema({
                    promo_code: {
                        // The location of the field, can be one or more of body, cookies, headers, params or query.
                        // If omitted, all request locations will be checked
                        in: ["query"],
                        exists: {
                            errorMessage: "Promo code not found.",
                        }
                    }
                }),
                validationResponse,
                verifyPromoCode)
            .get("/reward-product", getRewardProduct);
};