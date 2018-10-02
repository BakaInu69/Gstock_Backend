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
    console.log("Connecting as admin");
    app.use("/admin", adminRoute(config));
    app.use("/admin/attributes", attributeMgmtRoute(config));
    app.use("/admin/category", categoryMgmtRoute(config));
    app.use("/admin/product", productMgmtRoute(config));
    app.use("/admin/promotion", promotionMgmtRoute(config));
    app.use("/admin/reward-product", rewardProductMgmtRoute(config));
    app.use("/admin/user", userMgmtRoute(config));
    app.use("/admin/order", orderMgmtRoute(config));
    app.use("/admin/logistic", logisticRoute(config));
    app.use("/admin/email", new EmailMgmtRoutes(config).register());
    app.use("/user", new UserRoutes(config).register());
    app.use("/buyer", new BuyerRoutes(config).register());
    app.use("/merchant", merchantRoutes(config));
    app.use("/product", productRoutes(config));
    app.use("/order", orderRoutes(config));
    const swaggerUi = require("swagger-ui-express");
    const swaggerJson = require("../../src/swagger.json");
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerJson, { "showExplorer": true }));
};
