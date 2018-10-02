import * as mongoosePaginate from "mongoose-paginate";
import { Model, Document, Connection, Types, PaginateModel } from "mongoose";
import productAttributeSchema from "../Schemas/ProductAttribute";
import rewardPtsSchema from "../Schemas/RewardPts";
import variantSchema from "../Schemas/Variants";
import adminSchema from "../Schemas/Admin";
import userSchema from "../Schemas/User";
import buyerSchema from "../Schemas/Buyer";
import merchantSchema from "../Schemas/Merchant";
import productSchema from "../Schemas/Product";
import categorySchema from "../Schemas/Category";
import cartSchema from "../Schemas/Cart";
import orderSchema from "../Schemas/Order";
import commentSchema from "../Schemas/Comment";
import promotionSchema from "../Schemas/Promotion";
import attributeSchema from "../Schemas/Attribute";
import pendingStockSchema from "../Schemas/PendingStock";
import creditWalletSchema from "../Schemas/CreditWallet";
import complaintSchema from "../Schemas/Complaint";
import rewardProductSchema from "../Schemas/RewardProdcut";
import emailSchema from "../Schemas/Email";
export {
    productAttributeSchema,
    rewardPtsSchema,
    variantSchema,
    adminSchema,
    userSchema,
    buyerSchema,
    merchantSchema,
    productSchema,
    categorySchema,
    cartSchema,
    orderSchema,
    commentSchema,
    promotionSchema,
    attributeSchema,
    pendingStockSchema,
    creditWalletSchema,
    complaintSchema,
    rewardProductSchema,
    emailSchema
};