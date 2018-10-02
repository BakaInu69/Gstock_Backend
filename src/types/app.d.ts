import { Models } from "../models";
import { NextFunction, Request, Response } from "express";
import * as passport from "passport";
import { UserPassportClass } from "../config/user.passport";
import { PaginateModel, Model } from "mongoose";
import { UserModel } from "../models/User";
import { BuyerModel } from "../models/Buyer";
import { AdminModel } from "../models/Admin";
import { ProductModel } from "../models/Product";
import { CategoryModel } from "../models/Category";
import { OrderModel } from "../models/Order";
import { PromotionModel } from "../models/Promotion";
import { CartModel } from "../models/Cart";
import { VariantModel } from "../models/Variants";
import { AttributeModel } from "../models/Attribute";
import { PendingStockModel } from "../models/PendingStock";
import { RewardPtsModel } from "../models/RewardPts";
import { ProductAttributeModel } from "../models/ProductAttribute";
import { CommentModel } from "../models/Comment";
import { CreditWalletModel } from "../models/CreditWallet";
import { ComplaintModel } from "../models/Complaint";
import { RewardProductModel } from "../models/RewardProdcut";
import { EmailModel } from "../models/Email";
export interface UserPassport {
    userPassport: passport.Passport;
    isAuthorized(req: Request, res: Response, next: NextFunction): void;
    isAuthenticated(req: Request, res: Response, next: NextFunction): void;
    isJWTValid(req: Request, res: Response, next: NextFunction): void;
}
export interface AdminPassport {
    adminPassport: passport.Passport;
    isAuthorized(req: Request, res: Response, next: NextFunction): void;
    isAuthenticated(req: Request, res: Response, next: NextFunction): void;
    isJWTValid(req: Request, res: Response, next: NextFunction): void;
}

export interface Config {
    models: AdminModels | BuyerModels | MerchantModels;
    role: string;
    passport: {
        userPassport: UserPassportClass;
        adminPassport: AdminPassport;
    };
}

export interface AdminModels {
    User: PaginateModel<UserModel>;
    Buyer: PaginateModel<BuyerModel>;
    Admin: Model<AdminModel>;
    Product: PaginateModel<ProductModel>;
    Category: Model<CategoryModel>;
    Order: Model<OrderModel>;
    Cart: Model<CartModel>;
    Promotion: Model<PromotionModel>;
    Attribute: Model<AttributeModel>;
    Variant: Model<VariantModel>;
    PendingStock: Model<PendingStockModel>;
    RewardPts: Model<RewardPtsModel>;
    ProductAttribute: Model<ProductAttributeModel>;
    Comment: Model<CommentModel>;
    CreditWallet: Model<CreditWalletModel>;
    Complaint: Model<ComplaintModel>;
    RewardProdcut: Model<RewardProductModel>;
    Email: Model<EmailModel>;
}
export interface BuyerModels {
    User: PaginateModel<UserModel>;
    Buyer: PaginateModel<BuyerModel>;
    Product: PaginateModel<ProductModel>;
    Category: Model<CategoryModel>;
    Order: Model<OrderModel>;
    Cart: Model<CartModel>;
    Promotion: Model<PromotionModel>;
    Attribute: Model<AttributeModel>;
    Variant: Model<VariantModel>;
    RewardPts: Model<RewardPtsModel>;
    ProductAttribute: Model<ProductAttributeModel>;
    Comment: Model<CommentModel>;
    CreditWallet: Model<CreditWalletModel>;
    Complaint: Model<ComplaintModel>;
    RewardProdcut: Model<RewardProductModel>;
    Email: Model<EmailModel>;
}
export interface MerchantModels {
    User: PaginateModel<UserModel>;
    Product: PaginateModel<ProductModel>;
    Category: Model<CategoryModel>;
    Order: Model<OrderModel>;
    Attribute: Model<AttributeModel>;
    Variant: Model<VariantModel>;
    PendingStock: Model<PendingStockModel>;
    ProductAttribute: Model<ProductAttributeModel>;
    Comment: Model<CommentModel>;
    Complaint: Model<ComplaintModel>;
    Email: Model<EmailModel>;
}