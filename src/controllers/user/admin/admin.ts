import { NextFunction, Request, Response, Router } from "express";
import * as jwt from "jsonwebtoken";
import { IVerifyOptions } from "passport-local";
/**
 * Admin management
 */

export default (config) => {
  const { models, passport: { adminPassport: { adminPassport } } } = config;

  return Router()
    .post("/register",
      async (req: Request, res: Response, next: NextFunction) => {
        const { email, password } = req.body;
        req.assert("email", "Email is not valid").isEmail();
        req.assert("password", "Password must be at least 4 characters long").len({ min: 4 });
        req.assert("confirmPassword", "Passwords do not match").equals(password);
        req.sanitize("email").normalizeEmail({ gmail_remove_dots: false });
        const errors = req.validationErrors();
        if (errors) return res.status(400).send(errors);
        const existingAdmin = await models.Admin.findOne({ "credential.email": email });
        if (existingAdmin) return res.status(409).send("Account existed");
        await new models.Admin({
          credential: {
            email,
            password
          }
        }).save();
        return res.status(200).send("Register");
      })
    .post("/login",
      (req: Request, res: Response, next: NextFunction) => {
        req.checkBody("email", "Email is not valid").isEmail();
        req.checkBody("password", "Password cannot be blank").notEmpty();
        req.sanitize("email").normalizeEmail({ gmail_remove_dots: false });
        const { email } = req.body;
        const errors = req.validationErrors();
        if (errors) {
          return res.status(400).send({
            "authState": false,
            "errorMsg": errors
          });
        }

        adminPassport.authenticate("local", { session: false }, (err: Error, admin, info) => {
          if (err) { return next(err); }
          if (!admin) {
            return res.status(400).send(info);
          }
          const token = jwt.sign({ email, admin_id: admin.id }, process.env.JWTKEY);
          return res.status(200).send(
            { token });
          //   req.logIn(admin, { session: false }, async (err) => {
          //     if (err) { return next(err); }
          //     const admin = await models.Admin.findOneAndUpdate({ "credential.email": email }, { lastLogin: Date() }, { upsert: true, new: true });
          //     const token = jwt.sign({ email, admin_id: admin.id }, process.env.JWTKEY);

          // });
        })(req, res, next);
      })
    // .use("", passportConfig.isAdminJWTValid)
    // .get("", adminController.getAdmin)
    .put("/profile",
      async (req: Request, res: Response, next: NextFunction) => {
        req.assert("email", "Please enter a valid email address.").isEmail();
        req.sanitize("email").normalizeEmail({ gmail_remove_dots: false });
        const errors = req.validationErrors();
        if (errors) {
          return res.send(errors);
        }

        models.Admin.findOneAndUpdate({ email: req.body.email }, {
          "profile.group": req.body.profile.group,
          "profile.gender": req.body.profile.gender,
          "profile.firstName": req.body.profile.firstName
        }, { upsert: true, new: true }, (err, doc) => {
          return res.json(doc);
        });
      })
    .get("/report/total", async (req: Request, res: Response, next: NextFunction) => {
      const commission = await
        models.Order.aggregate(
          // Limit to relevant documents and potentially take advantage of an index
          [{
            $match: {
              "commission_status": "Approved"
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$total.commission" }
            }
          }]
        );
      const paid = await models.Order.aggregate(
        [{
          $match: {
            "status": "Paid"
          }
        },
        {
          $group: {
            _id: null,
            qty: { $sum: 1 },
            amt: { $sum: "$total.store_ap" }
          }
        }]);
      const result = {
        total: {
          order: {
            all: await models.Order.count({}),
            paid: {
              qty: paid[0]["qty"],
              amt: paid[0]["amt"]
            },
            AD: await models.Order.count({ "status": "AD" }),
            DG: await models.Order.count({ "status": "DG" }),
            GR: await models.Order.count({ "status": "GR" }),
          },
          products: {
            qty: await models.Product.count({}),
          },
          comission: {
            approved: commission[0]["total"]
          },
          user: {
            merchant: await models.User.count({ "credential.user_group": "merchant" }),
            buyer: await models.User.count({ "credential.user_group": "buyer" })
          }
        }
      };
      return res.status(200).send(result);
    });

};
/**
 * The following gets email from hotmail API
 * !!!Irrelevant to gstore project!!!
 */

// const s = {
//   client: {
//     id: "79043677-b4b7-456a-8345-14a0d45c3795",
//     secret: "7gQqoWQ7S5dyUBXzF6Qi7gu",
//   },
//   auth: {
//     tokenHost: "https://login.microsoftonline.com",
//     authorizePath: "common/oauth2/v2.0/authorize",
//     tokenPath: "common/oauth2/v2.0/token"
//   }
// };
// const oauth2 = require("simple-oauth2").create(s);
// const redirectUri = "http://localhost:3000/admin/emailauth";
// const scopes = ["openid", "User.Read", "Mail.Read"];
// const url = require("url");
// const microsoftGraph = require("@microsoft/microsoft-graph-client");
// export let getEmail = (req: Request, res: Response) => {

//   // The scopes the app requires
//   const returnVal = oauth2.authorizationCode.authorizeURL({
//     redirect_uri: redirectUri,
//     scope: scopes.join(" ")
//   });
//   return res.json({ "authUrl": returnVal });
// };


// export let authorize = (req: Request, res: Response) => {
//   w"Request handler 'authorize' was called.", req.query.code);

//   // The authorization code is passed as a query parameter

//   getTokenFromCode(req.query.code, tokenReceived, res);

// };
// function tokenReceived(res: Response, error: any, token: any) {
//   if (error) {
//     console.log("Access token error: ", error.message);
//     return res.json(error.message);
//   } else {
//     getUserEmail(token.token.access_token, (error: any, email: any) => {
//       if (error) {
//         console.log("getUserEmail returned an error: " + error);
//         return res.json("not ok");
//       } else if (email) {
//         console.log(email);
//         const cookies = ["node-tutorial-token=" + token.token.access_token + ";Max-Age=3600",
//         "node-tutorial-email=" + email + ";Max-Age=3600"];
//         console.log(cookies);
//         return res.json("ok");
//       } else if (!email) {
//         return res.json("null");
//       }
//     });
//   }
// }

// function getTokenFromCode(auth_code: any, callback: any, response: any) {
//   let token;
//   oauth2.authorizationCode.getToken({
//     code: auth_code,
//     redirect_uri: redirectUri,
//     scope: scopes.join(" ")
//   }, function (error: any, result: any) {
//     if (error) {
//       console.log("Access token error: ", error.message);
//       callback(response, error, undefined);
//     } else {
//       token = oauth2.accessToken.create(result);
//       console.log(token);
//       console.log(result);
//       callback(response, undefined, token);
//     }
//   });
// }

// function getUserEmail(token: any, callback: any) {
  // Create a Graph client
  // const client = microsoftGraph.Client.init({
  //   authProvider: (done: any) => {
  //     // Just return the token
  //     done(undefined, token);
  //   }
  // });

  // Get the Graph /Me endpoint to get user email address
  // client
  //   .api("/me/mailfolders/inbox/messages")
  //   .get((err: any, res: any) => {
  //     if (err) {
  //       console.log("got err", err);
  //       callback(err, undefined);
  //     } else {
  //       console.log(res);
  //       callback(undefined, res.mail);
  //     }
  //   });
// }
