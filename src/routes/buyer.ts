import routes from "./Subroutes";
import { Config } from "../types/app";
import { Express } from "express";
const {
    orderRoutes,
    productRoutes,
    attributeMgmtRoute,
    categoryMgmtRoute,
    productMgmtRoute,
    promotionMgmtRoute,
    rewardProductMgmtRoute,
    EmailMgmtRoutes,
    userMgmtRoute,
    BuyerRoutes,
    UserRoutes,
    merchantRoutes,
    adminRoute,
    logisticRoute,
    orderMgmtRoute
} = routes;
export default (app: Express, config: Config) => {
        const { userPassport } = config.passport;
        console.log("Connecting as buyer");
        /**
         * POST /user/login
         * POST /user/register
         * POST /user/register/fb
         * POST /user/forgot/reset
         * POST /user/forgot/email
         * POST /user/forgot/token
         * GET /user/account/detail
         * PUT /user/account/detail
         * POST /user/account/reset
         */
        app.use("/user", new UserRoutes(config).register());
        /**
         * GET /buyer/cart
         * POST /buyer/cart
         * PUT /buyer/cart
         * DELETE /buyer/cart/:cart_id
         * GET /buyer/order
         * POST /buyer/order/success
         * POST /buyer/order/confirm
         */
        app.use("/buyer", userPassport.isJWTValid.bind(userPassport), new BuyerRoutes(config).register());
        /**
         * GET /product/list
         * GET /product/product
         * GET /product/category
         * GET /product/variants/:id
         */
        app.use("/product", productRoutes(config));
        /**
         * POST /order/place
         * GET /order
         * GET /product/product
         * GET /product/category
         * GET /product/variants/:id
         */
        app.use("/order", userPassport.isJWTValid.bind(userPassport), orderRoutes(config));

};