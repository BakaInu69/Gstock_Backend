import { CartController } from "./cart";
import { ProductController } from "./product";
import { UserController } from "./user";
import { EmailController } from "./management/email";
import attributeController from "./attribute";

import categoryController from "./category";
import commentController from "./comment";
import { OrderController } from "./order";
import promotionController from "./promotion";
import rewardProductController from "./reward-product";
import userMgmtController from "./management/user";
import adminController from "./user/admin/admin";
import logisticController from "./logistic";
import { Config } from "../types/app";
export {
    attributeController,
    categoryController,
    CartController,
    OrderController,
    ProductController,
    promotionController,
    rewardProductController,
    EmailController,
    userMgmtController,
    logisticController,
    UserController
};