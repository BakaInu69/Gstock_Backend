import { NextFunction, Request, Response, Router } from "express";
import generateEmail from "../../emailTemplate/template";
import * as nodemailer from "nodemailer";
import * as fs from "fs";
import * as multer from "multer";
import paths from "./../../config/path";
import * as mkdirp from "mkdirp";
import { FILESIZE, FILETYPES } from "../../_global/variables";
import { Config } from "../../types/app";
import { generateWelcomeEmail } from "../../emailTemplate/welcome";
import * as crypto from "crypto";
import { UserModel } from "../../models/Schemas/User";
async function getRandomBytes() {
    return new Promise<string>((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
            if (err) { reject(err); }
            resolve(buf.toString("hex"));
        });
    });
}
export class EmailController {
    models;
    htmlStorage = multer.diskStorage({
        destination(req: Request, file, cb) {
            const fileUrl = `./dist/email_template/${req.body.type}/html/`;
            cb(undefined, fileUrl);
            // mkdirp(paths.appDir + fileUrl, () => cb(undefined, paths.appDir + fileUrl));
        },
        filename(req: Request, file, cb) {
            try {
                // file.originalname
                cb(undefined, "template.html");
            } catch (err) {
                cb(err, "/" + req.params.productId + "-" + file.originalname + ".png");
            }
        }
    });
    constructor(config) {
        this.models = config.models;
    }
    static replaceVariable(html, variable, value) {
        return html.replace(`{{{${variable}}}}`, value);
    }
    async getEmailTemplate(type, user: UserModel, additionalInfo) {
        try {
            const root = "./src/emailTemplate";

            const x = {
                WELCOME: async () => {
                    const { credential: { user_group, email }, profile: { first_name }, store: { name: storeName } } = user;
                    return {
                        templatePath: `${root}/welcome/welcome.html`,
                        imagesPath: `${root}/welcome/images`,
                        templateVariable: "USER",
                        value: "buyer" === user_group ? first_name : storeName,
                        subject: "Welcome to Gstock"
                    };
                },
                FORGOT: async () => {
                    const token = await getRandomBytes();
                    const { email } = additionalInfo;
                    const user = await this.models.User.findOne({ "credential.email": email }).select("credential");
                    const html = "buyer" === user.credential.user_group ? `<p>Hello,\n\nClick the below link https://gstock.sg/user/reset/${token} to reset ${email}.\n</p>` : `<p>Hello,\n\nClick the below link https://merchant.gstock.sg/reset/${token} to reset ${email}.\n</p>`;
                    return {
                        subject: "Password reset for Gstock",
                        html,
                        token
                    };
                }
            };
            return await x[type]();
            // case "NEW_ORDER":
            //     template = generateNewOrderEmail(email, totalRewardPts);
            //     break;
            // case "MER_ORDER":
            //     template = generateMerchantNewOrderEmail(email, orderStatus);
            //     break;
        }
        catch (error) {
            throw (error);
        }
    }
    getHtmlStorage() {
        return multer({
            storage: this.htmlStorage,
            // limits: { fileSize: FILESIZE.image },
            // fileFilter: function (req, file, cb) {
            //     const filetypes = FILETYPES.html;
            //     const mimetype = filetypes.test(file.mimetype);
            //     if (mimetype) return cb(null, true);
            //     cb(new Error("Error: File upload only supports the following filetypes - " + filetypes), false);
            // }
        });
    }
    async getEmailContent(req: Request, res: Response, next: NextFunction) {
        try {
            const welcome = await this.models.Email.findOne({ "type": "Welcome", "position": "content" });
            return res.status(200).send(welcome);
        } catch (error) {
            return next(error);
        }
    }
    async uploadEmailHTML(req: Request, res: Response, next: NextFunction) {
        try {
            const welcome = await this.models.Email.findOne({ "type": "Welcome", "position": "content" });
            return res.status(200).send(welcome);
        } catch (error) {
            return next(error);
        }
    }
    async uploadEmailAssets(req: Request, res: Response, next: NextFunction) {
        try {
            const welcome = await this.models.Email.findOne({ "type": "Welcome", "position": "content" });
            return res.status(200).send(welcome);
        } catch (error) {
            return next(error);
        }
    }
    sendEmail(type) {
        return async (req: Request, res: Response, next: NextFunction) => {
            const user = res.locals.user ? await this.models.User.findById(res.locals.user.id).select("+credential") : null;
            const {
                html,
                templatePath,
                imagesPath,
                token,
                value,
                templateVariable,
                subject
            } = await this.getEmailTemplate(type, user, req.body);
            const smtpTransport = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: "gstocktest123@gmail.com",
                    pass: "CYGA6677"
                }
            });
            let mailOptions;
            if (!html) {
                fs.readFile(templatePath, (err, chunk) => {
                    if (err) { return next(err); }
                    let html = chunk.toString("utf8");
                    html = EmailController.replaceVariable(html, templateVariable, value);
                    const files = fs.readdirSync(imagesPath + "/");
                    files.forEach(fn => html = html.replace(`images/${fn}`, `cid:unique@nodemailer.com-${fn}`));
                    const attachments = files.map(filename => ({
                        filename,
                        path: `${imagesPath}/${filename}`,
                        cid: `unique@nodemailer.com-${filename}` // same cid value as in the html img src
                    }));
                    mailOptions = {
                        to: "xiaokidz1990@gmail.com",
                        from: "gstore@admin.com",
                        subject,
                        html,
                        attachments
                    };
                    const sendEmail = new Promise((resolve, reject) => {
                        smtpTransport.sendMail(mailOptions,
                            (error, response: any) => { if (error) { console.log(error); reject(error); } else { console.log(response); resolve(response); } });
                    });
                    return res.status(200).send({ "message": "ok" });
                });
            } else {
                mailOptions = {
                    to: "xiaokidz1990@gmail.com",
                    from: "gstore@admin.com",
                    subject,
                    html
                };
                const sendEmail = new Promise((resolve, reject) => {
                    smtpTransport.sendMail(mailOptions,
                        (error, response: any) => { if (error) { console.log(error); reject(error); } else { console.log(response); resolve(response); } });
                });
                return res.status(200).send({ "message": "ok" });
            }

        };
    }

    async updateEmailContent(req: Request, res: Response, next: NextFunction) {
        try {
            await this.models.Email.findOneAndUpdate({ "type": "Welcome", "position": "content" }, { content: req.body.content });
            return res.status(200).send({ "message": "ok" });
        } catch (error) {
            return next(error);
        }
    }
}
