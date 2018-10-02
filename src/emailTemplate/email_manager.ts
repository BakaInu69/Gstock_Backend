
import * as nodemailer from "nodemailer";
import { generateWelcomeEmail } from "./welcome";
import { generateForgotEmail } from "./pwd_reset";
import { generateNewOrderEmail } from "./new_order";
import { generateMerchantNewOrderEmail } from "./mer_new_order";
import { UserModel } from "../models/Schemas/User";

export async function sendEmail(type, user: UserModel, additionalInfo) {
  const {
    credential: {
      email, user_group: userGroup
    },
    profile: {
      first_name: firstName
    },
    store: {
      name: storeName
    }
  } = user;
  const {
    orderStatus,
    totalRewardPts
  } = additionalInfo;
  let content;
  try {
    switch (type) {
      case "WELCOME":
        content = "buyer" === userGroup ? generateWelcomeEmail(firstName) : generateWelcomeEmail(storeName);
        break;
      case "FORGOT":
        content = await generateForgotEmail(email, userGroup);
        break;
      case "NEW_ORDER":
        content = generateNewOrderEmail(email, totalRewardPts);
        break;
      case "MER_ORDER":
        content = generateMerchantNewOrderEmail(email, orderStatus);
        break;
      default: break;
    }

    if (!content) throw Error("Unkown Email type");
    const {
      html,
      token,
      subject
    } = content;
    const smtpTransport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "gstocktest123@gmail.com",
        pass: "CYGA6677"
      }
    });
    const mailOptions = {
      to: email,
      from: "gstore@admin.com",
      subject,
      html
    };
    const sendEmail = new Promise((resolve, reject) => {
      smtpTransport.sendMail(mailOptions,
        (error, response: any) => { if (error) { console.log(error); reject(error); } else { console.log(response); resolve(response); } });
    });
    const sendEmailResult = sendEmail;
    return {
      token,
    };
  } catch (error) {
    throw (error);
  }
}