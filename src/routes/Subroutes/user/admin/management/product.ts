// import { validatePageAndLimit } from "../../../config/validation";
import { Request, Response, NextFunction, Router } from "express";
import { ProductController } from "../../../../../controllers";
import * as _ from "lodash";
/*
 * Product management
 * /admin/product
 */

export default (config) => {
    const productCtrl = new ProductController(config);
    const {
        adminGetProducts,
        adminUpdateProducts,
        isProductActiveOrInPendingOrder,
        adminDeleteSingleProduct,
        getSingleProductDetail,
        adminUpdateProductStatus,
        getProductsVariants
    } = _.bindAll(productCtrl, Object.getOwnPropertyNames(ProductController.prototype));
    return Router()
        .post("/",
            async (req: Request, res: Response, next: NextFunction) => { })
        .get("/search", adminGetProducts())
        .put("/", adminUpdateProducts)
        .delete("/", [isProductActiveOrInPendingOrder, adminDeleteSingleProduct])
        .get("/detail", getSingleProductDetail("admin"))
        .put("/status", adminUpdateProductStatus)
        .get("/variant", getProductsVariants);
    // .post("/putimage", productCtrl.putStoreName)
    // .get("/getEmail", adminController.getEmail)
    // .get("/emailauth", adminController.authorize)
};