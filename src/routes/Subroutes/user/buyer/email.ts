import { Request, Response, NextFunction, Router } from "express";
import * as _ from "lodash";
import { Config } from "../../../../types/app";
import { EmailController } from "../../../../controllers";
export class BuyerEmailRoutes {
    constructor(private config: Config) {
    }
    /**
     * /buyer/email
     */
    register() {
        const emailCtrl = new EmailController(this.config);
        const {
            // sendTestEmail,
        } = _.bindAll(emailCtrl, Object.getOwnPropertyNames(EmailController.prototype));
        return Router();
        // .post("/test", sendTestEmail);
    }
}
