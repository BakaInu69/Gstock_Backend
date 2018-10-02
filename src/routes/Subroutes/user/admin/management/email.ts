import { Request, Response, NextFunction, Router } from "express";
import { EmailController } from "../../../../../controllers";
import { Config } from "../../../../../types/app";
import * as _ from "lodash";
export class EmailMgmtRoutes {
    constructor(private config: Config) {
    }
    /**
     * /admin/email
     */
    register() {
        const emailCtrl = new EmailController(this.config);
        const {
            getEmailContent,
            updateEmailContent,
            sendEmail,
            getHtmlStorage
        } = _.bindAll(emailCtrl, Object.getOwnPropertyNames(EmailController.prototype));
        return Router()
            .get("/", getEmailContent)
            .put("/", updateEmailContent)
            .post("/test", sendEmail("WELCOME"))
            .post("/upload",
                getHtmlStorage().single("html"),
                (req: Request, res: Response, next: NextFunction) => {
                    return res.status(200).send({ message: "Upload succesfull" });
                });
    }
}
