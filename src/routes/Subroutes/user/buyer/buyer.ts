"use strict";
import { NextFunction, Request, Response, Router } from "express";
import { Types } from "mongoose";
import * as _ from "lodash";
import {
    UserController,
    CartController,
    OrderController,
    rewardProductController,
    EmailController
} from "../../../../controllers";
import { checkSchema } from "express-validator/check";
import { validationResponse } from "../../../../middleware/validationRes";

class Greeter {
    greeting: string;
    constructor(message: string) {
        this.greeting = message;
    }
    greet() {
        return "Hello, " + this.greeting;
    }
}
export class BuyerRoutes {
    constructor(private config) {
    }
    register() {
        const cartCtrl = new CartController(this.config);
        const userCtrl = new UserController(this.config);
        const orderCtrl = new OrderController(this.config);
        const {
            buyerGetCart,
            buyerAddProductToCart,
            buyerUpdateProductQtyInCart,
            buyerRemoveProductFromCart
        } = _.bindAll(cartCtrl, Object.getOwnPropertyNames(CartController.prototype));
        const {
            getCreditWalletHistory,
            getRewardPts
        } = _.bindAll(userCtrl, Object.getOwnPropertyNames(UserController.prototype));

        const {
            getOrder,
            // buyerGetOrder,
            buyerConfirmOrder,
            buyerPostComment,
            buyerPostComplaint
        } = _.bindAll(orderCtrl, Object.getOwnPropertyNames(OrderController.prototype));
        const {
            purchaseRewardProduct
        } = rewardProductController(this.config);
        const emailCtrl = new EmailController(this.config);
        const {
            sendEmail,
        } = _.bindAll(emailCtrl, Object.getOwnPropertyNames(EmailController.prototype));
        return Router()
            .post("/welcome", sendEmail("WELCOME"))
            .get("/cart", buyerGetCart)
            .post("/cart", checkSchema({
                product_id: {
                    in: ["body"],
                    exists: { errorMessage: "Product id is required." }
                },
                qty: {
                    in: ["body"],
                    exists: { errorMessage: "Quantity is required." }
                }
            }), validationResponse, buyerAddProductToCart)
            .put("/cart", buyerUpdateProductQtyInCart)
            .delete("/cart/:cart_id", checkSchema({
                cart_id: {
                    in: ["params"],
                    exists: { errorMessage: "Cart id is required." }
                }
            }), buyerRemoveProductFromCart)

            .get("/order", getOrder("buyer"))
            .post("/order/confirm", buyerConfirmOrder)
            .get("/rewardpts", getRewardPts)
            .post("/comment", buyerPostComment)
            .get("/credit", getCreditWalletHistory)
            .post("/order/complaint", buyerPostComplaint);
    }
}