import { NextFunction, Request, Response, Router } from "express";
import { checkSchema } from "express-validator/check";
import { validationResponse } from "../../../middleware/validationRes";
import {
    OrderController,
    rewardProductController
} from "../../../controllers";
import * as _ from "lodash";
export default (config) => {
    const orderCtrl = new OrderController(config);
    const {
        getOrderDetail,
        getPromotionDetailFromPromoCode,
        processStore,
        placeOrder,
        buyerMadePayment,
        getPendingStock,
        substractPendingStock,
        pendingStock,
        getOrder,
        buyerConfirmOrder
    } = _.bindAll(orderCtrl, Object.getOwnPropertyNames(OrderController.prototype));
    const { purchaseRewardProduct } = rewardProductController(config);
    return Router()
        .get("/", getOrder("buyer"))
        // .get("/", async (req: Request, res: Response, next: NextFunction) => {
        //     const orders = await models.Order.find({});

        //     // { $and: [{ "createdAt": { $gte: req.body.start } }, { "createdAt": { $gte: req.body.end } }]

        //     // if (err) return next(err);
        //     return res.status(200).send(orders);
        // })
        .post("/place", checkSchema({

            "delivery": {
                in: ["body"],
                exists: { errorMessage: "Missing devliery details", negated: false }
            },
            orders: {
                in: ["body"],
                isArray: { errorMessage: "Empty order" }
                // exists: { errorMessage: "Empty order" }
            },
            "orders.*.products": {
                in: ["body"],
                // exists: { errorMessage: "Empty order" },
                isArray: { errorMessage: "Empty products" }
            },
            "orders.*.merchant_id": {
                in: ["body"],
                exists: { errorMessage: "Empty products", negated: false }
            },
            "orders.*.products.product_id": {
                in: ["body"],
                // exists: {errorMessage: "Missing product Id"},
            },
            "orders.*.products.*.variants.*.qty": {
                in: ["body"],
                exists: {errorMessage: "Product quantity must not be lower than 1."},
                isInt: {
                    options: { min: 1 },
                    errorMessage: "Product quantity must not be lower than 1.",
                }
            }
        }), [validationResponse, getOrderDetail, getPromotionDetailFromPromoCode, processStore, placeOrder])
        .post("/success",
            checkSchema({
                order_id: {
                    in: ["body"],
                    exists: { errorMessage: "Empty order"},
                    custom: {
                        options: value => value.length,
                        errorMessage: "The order is empty"
                    }
                },
                paypal: {
                    in: ["body"],
                    exists: { errorMessage: "Paypal detail required"}
                },
            }),
            [
                validationResponse,
                buyerMadePayment,
                getPendingStock,
                substractPendingStock
            ], async (req: Request, res: Response, next: NextFunction) => {
            return res.status(200).send({"message": "Order placed successfully"});
                // res.locals;
        })
        .post("/confirm", buyerConfirmOrder)
        .get("/pending", pendingStock)
        .post("/reward-product/order", purchaseRewardProduct);

};