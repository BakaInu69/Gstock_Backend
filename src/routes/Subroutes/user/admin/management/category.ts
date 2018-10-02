import { Request, Response, NextFunction, Router } from "express";
import { categoryController } from "../../../../../controllers";
/**
 * Category Management
 */
export default (config) => {
    const {
        postCategory,
        updateCategory,
        deleteCategory,
        appendCategory,
        getAllCategory,
        updateCommission,
        removeProductAttributes,
        assginAttributeToCategory,
        getProductAttributes,
        createProductAttributes,
        updateProductAttributes
    } = categoryController(config);
    return Router()
        .post("/", postCategory)
        .put("/", updateCategory)
        .post("/delete", deleteCategory)
        .post("/append", appendCategory)
        .get("/all", getAllCategory)
        .put("/commission", updateCommission)
        .get("/attribute", getProductAttributes)
        .post("/attribute", createProductAttributes)
        .delete("/attribute", removeProductAttributes)
        .put("/attribute", updateProductAttributes)
        .post("/attribute/assign", assginAttributeToCategory);
};