import * as crypto from "crypto";
async function getRandomBytes() {
    return new Promise<string>((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
            if (err) { reject(err); }
            resolve(buf.toString("hex"));
        });
    });
}

export const generateForgotEmail = async (toEmail, userGroup) => {
    const token = await getRandomBytes();
    const html = "buyer" === userGroup ? `<p>Hello,\n\nClick the below link http://54.254.213.149/ecommerce/user/reset/${toEmail}/${token} to reset ${toEmail}.\n</p>` : `<p>Hello,\n\nClick the below link http://localhost/merchant_panel/reset/${toEmail}/${token} to reset ${toEmail}.\n</p>`;
    return {
        subject: "Password reset for Gstock",
        html,
        token
    };
};