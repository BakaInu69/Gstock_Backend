import { NextFunction, Request, Response, Router } from "express";
import * as nodemailer from "nodemailer";
import * as fs from "fs";
const smtpTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "gstocktest123@gmail.com",
        pass: "CYGA6677"
    }
});
export class EmailService {
    constructor() {
    }
    static replaceVariable(html, variable, value) {
        return html.replace(`{{{${variable}}}}`, value);
    }
    createEmailTemplate(type, payload) {
        try {
            const root = "./src/emailTemplate";
            const x = {
                WELCOME:  () => {
                    const { credential: { user_group, email }, profile: { first_name } } = payload;
                    return {
                        templatePath: `${root}/welcome/welcome.html`,
                        imagesPath: `${root}/welcome/images`,
                        templateVarKey: "USER",
                        templateVarVal: "buyer" === user_group ? first_name : payload.store.name,
                        subject: "Welcome to Gstock"
                    };
                },
                FORGOT: () => {
                    const { token, user_group } = payload;
                    const html = "buyer" === user_group ? `<p>Hello,\n\nClick the below link ${process.env.BUYER_API}/user/forgot/${token} to reset.\n</p>` : `<p>Hello,\n\nClick the below link ${process.env.MERCHANT_API}}/user/forgot/${token} to reset.\n</p>`;
                    return {
                        subject: "Password reset for Gstock",
                        html,
                        token
                    };
                }
            };
            return x[type]();
        }
        catch (error) {
            throw (error);
        }
    }
    async sendEmail(type, payload, to?, from?, ) {
            // const user = res.locals.user ? await this.models.User.findById(res.locals.user.id).select("+credential") : null;
            const {
                html,
                templatePath,
                imagesPath,
                token,
                templateVarVal,
                templateVarKey,
                subject
            } = this.createEmailTemplate(type, payload);

            const mailOptions = {
                to: "xiaokidz1990@gmail.com",
                from: "gstore@admin.com",
                subject,
                html
            };
            if (!html) {Object.assign(mailOptions, await this.createEmailTemplateWithVariableAndAttachment(templatePath, templateVarKey, templateVarVal, imagesPath)); }
            const sendEmail = smtpTransport.sendMail(mailOptions, (error, response: any) =>  console.log(error ? error : response));
    }
    createEmailTemplateWithVariableAndAttachment(templatePath, templateVarKey, templateVarVal, imagesPath) {
        return new Promise((resolve, reject) => fs.readFile(templatePath, (err, chunk) => {
            if (err) { return reject(err); }
            let html = chunk.toString("utf8");
            html = EmailService.replaceVariable(html, templateVarKey, templateVarVal);
            const files = fs.readdirSync(imagesPath + "/");
            files.forEach(fn => html = html.replace(`images/${fn}`, `cid:unique@nodemailer.com-${fn}`));
            const attachments = files.map(filename => ({
                filename,
                path: `${imagesPath}/${filename}`,
                cid: `unique@nodemailer.com-${filename}` // same cid value as in the html img src
            }));
            return resolve({
                html,
                attachments
            });
        }));
    }
    createMailOptions() {

    }
}
