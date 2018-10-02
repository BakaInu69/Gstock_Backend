import { NextFunction, Request, Response } from "express";
import { IVerifyOptions } from "passport-local";
import { sendEmail } from "./../emailTemplate/email_manager";
import * as jwt from "jsonwebtoken";
import { ObjectID } from "bson";
import { Config } from "../types/app";
import * as flat from "flat";
import { Passport } from "passport";
import { More } from "../_lib/decorators";
import { BaseController } from "../_lib/crud";
import { PaginateModel } from "mongoose";
import { UserModel } from "../models/Schemas/User";
import { UserService } from "../services/user.service";
const debug = require("debug")("gstock:controller");
interface RegisterBody {
    email: string;
    contact_no: string;
    password: string;
    store_name: string;
    user_group: string;
    first_name: string;
    last_name: string;
}
export class UserController {
    public models;
    public userService: UserService;
    public userPassport: Passport;
    constructor(private config: Config) {
        this.models = config.models;
        this.userService = new UserService(this.models);
        this.userPassport = config.passport.userPassport.getUserPassport();
    }
    @More({
        "100000": {
            "message": "Login successful.",
            "detail": "Feel like being talktive?",
        },
        "100001": {
            "message": "Account does not exist.",
            "detail": "Does not look good mate.",
        },
        "100002": {
            "message": "Invalid password.",
            "detail": "Does not look good mate.",
        }
    })
    public async login(req: Request, res: Response, next: NextFunction) {
        try {
            req.sanitize("email").normalizeEmail({ gmail_remove_dots: false });
            const { email, user_group } = req.body;
            return await new Promise((resolve, reject) => this.userPassport.authenticate("local", { session: false }, (err: Error, user, info: IVerifyOptions) => {
                if (err) return reject(err);
                if (!user) return reject({ ...info });
                const payload = {
                    id: user.id,
                    user_group,
                    timestamp: new Date(),
                    expired: 900
                };
                const token = jwt.sign(payload, process.env.JWTKEY);
                resolve({
                    status_code: 200,
                    detail_code: 100000,
                    token,
                    user_id: user._id,
                    email: user.credential.email,
                });
            })(req, res, next));
        } catch (error) {
            return error.status_code ? error : {
                error,
                status_code: 500,
                detail_code: "error"
            };
        }
    }

    public async fbRegister(req: Request, res: Response, next: NextFunction) {
        const {
            email,
            contact_no,
            first_name,
            last_name,
            id: fb_id
        } = req.body;
        const errors = await req.getValidationResult();
        if (!errors.isEmpty()) { return res.status(400).json(errors.array({ onlyFirstError: true })); }
        const oldUser = await this.models.User.findOne({ "credential.fb_id": fb_id });
        if (oldUser) {
            // pass old user info to next handler
            res.locals.user = oldUser;
            // if old user, set welcome email flag to false
            res.locals.welcome = false;
            return next();
        }
        // check if a new user has fb email in conflict
        if (!email) return res.status(404).json("Email is needed!");
        await (this.models.User as UserModel).isEmailExist(email);
        const newUser = await new this.models.User({
            credential: {
                email,
                // by default fb regsiter is only open to buyer
                user_group: "buyer",
                fb_id
            },
            profile: {
                first_name,
                last_name
            }
        }).save();
        res.locals.user = newUser;
        // if new user, set welcome email flag to true
        res.locals.welcome = true;
        return next();
    }
    @More({
        "100000": {
            "message": "Email has been taken.",
            "detail": "Try a new one.",
        },
        "100001": {
            "message": "Account does not exist.",
            "detail": "Does not look good mate.",
        },
        "100002": {
            "message": "Store name existed",
            "detail": "Please try another name",
        }
    })
    public async register(req: Request, res: Response, next: NextFunction) {
        try {
            req.sanitize("email").normalizeEmail({ gmail_remove_dots: false });
            const {
                email,
                contact_no,
                password,
                store_name,
                user_group,
                first_name,
                last_name
            } = req.body as RegisterBody;
            const user = {
                credential: {
                    email,
                    user_group,
                    password,

                },
                profile: {
                    first_name,
                    last_name
                },
                contact: {
                    mobile_no: contact_no
                },
                store: {
                    name: store_name
                }
            };
            const data = await this.userService.register(user);
            return {
                status_code: 200,
                ...data
            };
        } catch (e) {
            return e;
        }

    }
    public async isResetPasswordTokenValid(req: Request, res: Response, next: NextFunction) {
        try {
            if (await this.userService.isResetPasswordTokenValid(req.params.token)) {
                return res.status(200).send({"message": "Token valid"});
            } else {
                return res.status(400).send({"message": "Token invalid"});
            }
        } catch (error) {
            next(error);
        }
    }
    public async resetUserPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const {
                password,
                old_password
            } = req.body;
            const user = await this.models.User.findUserCredentialById(res.locals.user.id);
            if (!user) return res.status(400).send({ message: "No such user." });
            user.comparePassword(old_password, user.credential.password, async (err, isMatched) => {
                if (!isMatched) return res.status(400).send({ message: "Wrong password!" });
                user.credential.password = password;
                await user.save();
                return res.status(200).send({
                    message: "Password changed"
                });
            });
        } catch (error) {
            return next(error);
        }
    }

    public async userForgotPasswordReset(req: Request, res: Response, next: NextFunction) {
        const { token, new_pw } = req.body;
        try {
            await this.userService.userResetPassword(token, new_pw);
            return res.status(200).send({ message: "Password updated!" });
        } catch (error) {
            return res.status(400).send(error);
        }
    }
    public async userRequestForgetPassword(req: Request, res: Response, next: NextFunction) {
        const { email } = req.body;
        try {
            await this.userService.userRequestResetPassword(email);
            return res.status(200).send({ message: "Forget password email sent!" });
        } catch (error) {
            return next(error);
        }
    }

    public async generateToken(req: Request, res: Response, next: NextFunction) {
        const { user: { id, credential: { email, user_group } } } = res.locals;
        // send token only on registration
        const payload = {
            id,
            user_group,
            timestamp: new Date(),
            expired: 900
        };
        const token = jwt.sign(payload, process.env.JWTKEY);
        return res.status(200).send({
            token,
            email
        });

    }

    public async updateEmailVerifToken(req: Request, res: Response, next: NextFunction) {
        const { email, token } = req.query;
        const user = await this.models.User.findOneAndUpdate(
            {
                "credential.email": email,
                "credential.email_verif_expires": { $gt: Date.now() },
                "credential.email_verif_token": token
            },
            {
                $set: { "credential.email_verified": true }
            },
        ).lean();
        return user ? res.status(200).json({ message: "Email verfied" }) : res.status(404).json({ message: "No valid user found" });
    }

    @More(
        {
            "0": {
                "message": "",
            }
        })
    public async getUserAccountDetail(req: Request, res: Response, next: NextFunction) {
        return res.status(200).send(res.locals.user.toJSON());
    }

    @More(
        {
            "0": {
                "message": "",
            }
        }
    )
    public async updateUserAccountDetail(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await this.models.User.findByIdAndUpdate(res.locals.user.id, { $set: flat.flatten(req.body) }, { new: true });
            console.log(flat.flatten(req.body));
            return res.status(200).send(result.toJSON());
        } catch (error) {
            return error.status_code ? error : next(error);
        }
    }

    @More({})
    public async getRewardPts(req: Request, res: Response, next: NextFunction) {
        try {
            console.log("reward pts");
            return res.status(200).send(await this.models.RewardPts.find({ buyer_id: res.locals.user.id }));
        } catch (error) {
            console.log(error);
            return error.status_code ? error : next(error);
        }
    }

    @More({
            "100001": {
                "message": "Invalid objectID.",
                "detail": "Feel like being talktive?",
                "overwrite": 404
            }
        },
    )
    public async getProductsInStore(req: Request, res: Response, next: NextFunction) {
        try {
            const { merchant_id } = req.query;
            return res.status(200).send({
                detail: await this.models.User.getMerchantOrError(merchant_id),
                products: await this.models.Product.getApprovedProductByMerchant(new ObjectID(merchant_id))
            });
        } catch (error) {
            console.log(error.message);
            return error.status_code ? error : {
                error,
                status_code: 500,
                detail_code: "error"
            };
        }
    }

    public async getCreditWalletHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const findTotal = await this.models.CreditWallet.aggregate(
                [
                    {
                        $match: {
                            "buyer_id": new ObjectID(res.locals.user.id)
                        }
                    },
                    {
                        $group: {
                            "_id": "",
                            "total": { "$sum": "$amount" }
                        }
                    },
                    {
                        $project: {
                            "_id": 0,
                            "total": "$total"
                        }
                    }
                ]
            );

            return res.status(200).send({
                "data": {
                    history: await this.models.CreditWallet.find({ "buyer_id": new ObjectID(res.locals.user.id) }),
                    ...findTotal[0],
                }
            });
        } catch (error) {
            return next(error);
        }
    }
}