import { NextFunction, Request, Response, Router } from "express";
import { checkSchema } from "express-validator/check";
// import { validationResponse } from "../../../middleware/validationRes";
import {
    logisticController,
} from "../../../controllers";

export default (config) => {
    const {
        getWebhook,
        sendOrderToLogisticProvider
    } = logisticController(config);
    return Router()
        .post("/status/update", getWebhook)
        .post("/place", sendOrderToLogisticProvider);
};