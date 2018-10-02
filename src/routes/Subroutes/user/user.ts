import { Router } from "express";
import { body, checkSchema } from "express-validator/check";
import * as multer from "multer";
import * as mkdirp from "mkdirp";
import * as _ from "lodash";
import { UserController, EmailController } from "../../../controllers";
import { validationResponse } from "../../../middleware/validationRes";
/**
 * User routes.
 */
const profilePictureStorage = multer.diskStorage({
    destination(req, file, cb) {
        const userId = (<any>req).locals.user.id;
        mkdirp("./dist/uploads/user/" + userId,
            () => cb(undefined, "./dist/uploads/user/" + userId)
        );
    },
    filename(req, file, cb) {
        try {
            cb(undefined, "/profile_picture.png");
        } catch (err) {
            cb(err, "/profile_picture.png");
        }
    }
});
const profilePictureUpload = multer({
    storage: profilePictureStorage
});

export class UserRoutes {
    constructor(private config) {
    }
    register() {
        const { passport: { userPassport } } = this.config;
        const userCtrl = new UserController(this.config);
        const {
            register,
            login,
            userForgotPasswordReset,
            userRequestForgetPassword,
            resetUserPassword,
            isResetPasswordTokenValid,
            generateToken,
            fbRegister,
            getUserAccountDetail,
            updateUserAccountDetail,
            updateEmailVerifToken,
        } = _.bindAll(userCtrl, Object.getOwnPropertyNames(UserController.prototype));
        const emailCtrl = new EmailController(this.config);
        const {
            sendEmail,
        } = _.bindAll(emailCtrl, Object.getOwnPropertyNames(EmailController.prototype));
        return Router()
            .post("/login",
                checkSchema({
                    email: {
                        in: ["body"],
                        exists: { errorMessage: "Email is required" }
                    },
                    password: {
                        in: ["body"],
                        exists: { errorMessage: "Password is required" }
                    },
                    user_group: {
                        in: ["body"],
                        exists: { errorMessage: "User group is required" }
                    }
                }),
                validationResponse,
                login
            )
            .post("/register",
                checkSchema({
                    email: {
                        in: ["body"],
                        exists: { errorMessage: "Email is required" }
                    },
                    password: {
                        in: ["body"],
                        exists: { errorMessage: "Password is required" },
                        custom: {
                            options: (value, { req }) => req.body.confirm_password === value,
                            errorMessage: "Password does not match"
                        }
                    },
                    confirm_password: {
                        in: ["body"],
                        exists: { errorMessage: "Confirm password is required." },
                        custom: {
                            options: (value, { req }) => req.body.password === value,
                            errorMessage: "Password does not match"
                        }
                    },
                    user_group: {
                        in: ["body"],
                        exists: { errorMessage: "User group is required.", },
                        isIn: {
                            options: [["buyer", "merchant"]],
                            errorMessage: "Unknown user group"
                        },
                        custom: {
                            options: (value, {req}) => "buyer" === req.body.user_group || req.body.store_name ,
                            errorMessage: "Store name cannot be empty."
                        }
                    },
                    first_name: {
                        in: ["body"],
                        exists: { errorMessage: "First name is required." },
                    },
                }),
                validationResponse,
                register
            )
            .post("/register/fb",
                [
                    // body("email", "Missing properties").exists(),
                    // body("email", "Invalid Email format").isEmail(),
                ],
                fbRegister,
                // sendEmail("WELCOME"),
                generateToken
            )
            .post("/forgot/reset",
            checkSchema({
                new_pw: {
                    in: ["body"],
                    exists: { errorMessage: "New password is required" }
                },
                token: {
                    in: ["body"],
                    exists: { errorMessage: "Token is required" }
                }
            }),
            validationResponse,
            userForgotPasswordReset)
            .get("/forgot/token/valid/:token",
                isResetPasswordTokenValid
            )
            .post("/forgot/email",
                checkSchema({
                    email: {
                        in: ["body"],
                        exists: { errorMessage: "Email is required" }
                    }
                }),
                validationResponse,
                userRequestForgetPassword)
            .post("/forgot/token",
                updateEmailVerifToken
            )
            .get("/account/detail",
                userPassport.isJWTValid.bind(userPassport),
                getUserAccountDetail
            )
            .put("/account/detail",
                checkSchema({
                    credential: {
                        in: "body",
                        optional: true,
                        custom: { options: (value) => false }
                    }
                }),
                validationResponse,
                userPassport.isJWTValid.bind(userPassport),
                profilePictureUpload.array("profilePic"),
                updateUserAccountDetail
            )
            .post("/account/reset",
                checkSchema({
                    email: {
                        in: ["body"],
                        errorMessage: "Email is required",
                    },
                    old_password: {
                        in: ["body"],
                        errorMessage: "Old password is required"
                    },
                    password: {
                        in: ["body"],
                        errorMessage: "Password is required",
                        custom: { options: (value, { req }) => req.body.confirm_password === value }
                    },
                    confirm_password: {
                        in: ["body"],
                        errorMessage: "Confirm password is required.",
                        custom: { options: (value, { req }) => req.body.password === value }
                    },
                }),
                validationResponse,
                userPassport.isJWTValid.bind(userPassport),
                userForgotPasswordReset);
    }
}