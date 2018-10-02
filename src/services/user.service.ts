import { UserModel } from "../models/Schemas/User";
import { EmailService } from "./email.service";
const debug = require("debug")("gstock:service");
export class UserService {
    User: UserModel = this.models.User;
    emailService: EmailService;
    constructor(private models) {
        this.emailService = new EmailService();
    }
    async userResetPassword(token: string, new_pw: string) {
        try {
            const decrypted = this.User.parseForgetPasswordToken(token);
            const email = JSON.parse(decrypted).email;
            const user = await this.User.findUserCredentialByEmail(email);
            if (!user) throw({ message: "Invalid user!" });
            if (!user.canResetPassword(token)) throw({ message: "Invalid token!" });
            await user.clearForgetPasswordToken();
            await user.updatePassword(new_pw);
        } catch (error) {
            if (error instanceof SyntaxError) {
                throw ({"message": "Invalid token"});
            }
            throw (error);
        }
    }
    async userRequestResetPassword(email: string) {
        try {
            const user = await this.User.findUserCredentialByEmail(email);
            if (!user) {return; }
            const forgetPasswordToken = await user.updateForgetPasswordToken();
            debug("forgetPasswordToken", forgetPasswordToken);
            this.emailService.sendEmail("FORGOT", {
                token: forgetPasswordToken,
                user_group: user.credential.user_group
            });
        } catch (error) {
            throw(error);
        }
    }
    async register(user) {
        try {
            await this.User.isEmailExist(user.credential.email);
            if ("merchant" === user.credential.user_group) {
                const storeName = await this.models.User.isStoreNameExist(user.store.name);
                if (storeName) {
                    throw({
                        status_code: 409,
                        detail_code: 100002,
                        message: "Store name has been taken."
                    });
                }
            }
            const userRegistered = await this.User.createUser(user);
            await this.emailService.sendEmail("WELCOME", user);
            return await userRegistered.generateToken();
        } catch (error) {
            throw(error);
        }
    }
    async isResetPasswordTokenValid(token) {
        return await this.User.isResetPasswordTokenValid(token);
    }
}