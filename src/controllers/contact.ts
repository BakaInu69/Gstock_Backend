import * as nodemailer from "nodemailer";
import { Request, Response } from "express";
import * as dotenv from "dotenv";


/**
 * POST /contact
 * Send a contact form via Nodemailer.
 */
export let postContact = (req: Request, res: Response) => {
  // req.assert("name", "Name cannot be blank").notEmpty();
  // req.assert("email", "Email is not valid").isEmail();
  // req.assert("message", "Message cannot be blank").notEmpty();

  // const errors = req.validationErrors();

  // if (errors) {

  //   return res.json("/contact");
  // }
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "gstocktest123@gmail.com",
      pass: "CYGA6677"
    }
  });

  const mailOptions = {
    from: "Gtsock@gmail.com",
    to: "xianyic@gmail.com",
    subject: "Thank you for shopping with us!",
    text: "Your order is being processed!"
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      return res.status(400).send("error");
    } else {
      console.log("Email sent: " + info.response);
      return res.status(200).send("sent");
    }
  });

  // const mailOptions = {
  //   to: "your@email.com",
  //   from: `${req.body.name} <${req.body.email}>`,
  //   subject: "Contact Form",
  //   text: req.body.message
  // };

  // transporter.sendMail(mailOptions, (err) => {
  //   if (err) {

  //     return res.json("/contact");
  //   }

  //   res.json("/contact");
  // });
};
