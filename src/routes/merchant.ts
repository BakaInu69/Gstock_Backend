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
    console.log("Connecting as merchant");
        /**
         * POST /user/login
         * POST /user/register
         * POST /user/forgot/reset
         * POST /user/forgot/email
         * POST /user/forgot/token
         * GET /user/account/detail
         * PUT /user/account/detail
         * POST /user/account/reset
         */
        app.use("/user", new UserRoutes(config).register());
        /*
         * POST /merchant/product
         * GET /merchant/order
         */
        app.use("/merchant", userPassport.isJWTValid.bind(userPassport), merchantRoutes(config));
        app.use("/product", productRoutes(config));
        // app.use("/order", userPassport.isJWTValid.bind(userPassport),orderRoutes(config));
        return;
};