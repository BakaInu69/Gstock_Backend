import { Request, Response, NextFunction, Router } from "express";
import promotionController from "../../../../../controllers/promotion";
import { checkSchema } from "express-validator/check";
import { validationResponse } from "../../../../../middleware/validationRes";
/*
 * Promotion management
 */
export default (config) => {
    const {
        createNewPromotion,
        getPromotion,
        updatePromotion,
        updateStatus
    } = promotionController(config);
    return Router()
        .post("/", checkSchema({
            name: {
                in: ["body"],
                exists: {
                    options: {
                        checkNull: true
                    },
                    errorMessage: "Name is required"
                }
            },
            detail: {
                in: ["body"],
                exists: {
                    options: {
                        checkNull: true
                    },
                    errorMessage: "Promotion detail is required" }
            },
            start: {
                in: ["body"],
                exists: {
                    options: {
                    checkNull: true
                },
                errorMessage: "Promotion start date is required" }
            },
            end: {
                in: ["body"],
                exists: {
                    options: {
                        checkNull: true
                    },
                    errorMessage: "Promotion end date is required" }
            },
            promo_code: {
                in: ["body"],
                exists: {
                    options: {
                        checkNull: true
                    },
                    errorMessage: "Promotion code is required" }
            },
            value: {
                in: ["body"],
                exists: {
                    options: {
                    checkNull: true
                },
                errorMessage: "Promotion value is required" }
            },
            promo_type: {
                in: ["body"],
                exists: {
                    options: {
                        checkNull: true
                    },
                    errorMessage: "Promotion type is required" }
            },
            kind: {
                in: ["body"],
                exists: {
                    options: {
                        checkNull: true
                    },
                    errorMessage: "Name is required" }
            }
        }), validationResponse, createNewPromotion)
        .get("/", getPromotion)
        .put("/", updatePromotion)
        .put("/status", updateStatus);
};