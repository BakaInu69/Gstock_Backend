import * as nodemailer from "nodemailer";
import * as fs from "fs";
const ROOT = "./src/emailTemplate";
export class EmailTemplateCreator {
    constructor() {}
    static replaceVariable(html, variable, value) {
        return html.replace(`{{{${variable}}}}`, value);
    }
    async createEmailTemplate(type, payload) {
            const root = "./src/emailTemplate";
            const listOfTemplate = {
                FORGOT: this.FORGOT,
                WELCOME: this.WELCOME
            };
            const theTemplate = listOfTemplate[type];
            const {
                html,
                templatePath,
                imagesPath,
                templateVarVal,
                templateVarKey,
                subject
            } = theTemplate(...payload);
            return html ? {} : await this.createEmailTemplateWithVariableAndAttachment(templatePath, templateVarKey, templateVarVal, imagesPath);
    }
    createEmailTemplateWithVariableAndAttachment(templatePath, templateVarKey, templateVarVal, imagesPath) {
        return new Promise((resolve, reject) => fs.readFile(templatePath, (err, chunk) => {
            if (err) { return reject(err); }
            let html = chunk.toString("utf8");
            html = EmailTemplateCreator.replaceVariable(html, templateVarKey, templateVarVal);
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

    FORGOT (token, user_group) {
        const html = "buyer" === user_group ? `<p>Hello,\n\nClick the below link ${process.env.BUYER_API}/user/forgot/${token} to reset.\n</p>` : `<p>Hello,\n\nClick the below link ${process.env.MERCHANT_API}}/user/forgot/${token} to reset.\n</p>`;
        return {
            subject: "Password reset for Gstock",
            html
        };
    }
    WELCOME(userGroup, firstName, storeName) {
        return {
            templatePath: `${ROOT}/welcome/welcome.html`,
            imagesPath: `${ROOT}/welcome/images`,
            templateVarKey: "USER",
            templateVarVal: "buyer" === userGroup ? firstName : storeName,
            subject: "Welcome to Gstock"
        };
    }
}