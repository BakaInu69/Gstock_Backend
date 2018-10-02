import { Connection, PaginateModel } from "mongoose";
import {
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
} from "../Schemas";
import { UserModel } from "../Schemas/User";
import { BuyerModel } from "../Schemas/Buyer";
import { ProductModel } from "../Schemas/Product";
import { EmailModel } from "../Schemas/Email";
export default (db: Connection) => {
    // const db = connection.useDb(process.env.MONGODB_DATABASE);
    return {
        User: db.model("User", userSchema) as PaginateModel<UserModel>,
        Buyer: db.model("Buyer", buyerSchema) as PaginateModel<BuyerModel>,
        Cart: db.model("Cart", cartSchema),
        CreditWallet: db.model("Credit", creditWalletSchema),

        RewardPts: db.model("RewardPts", rewardPtsSchema),
        Product: db.model("Product", productSchema) as PaginateModel<ProductModel>,
        Category: db.model("Category", categorySchema),
        Promotion: db.model("Promotion", promotionSchema),
        Attribute: db.model("Attribute", attributeSchema),
        ProductAttribute: db.model("ProductAttribute", productAttributeSchema),
        Variant: db.model("Variant", variantSchema),
        Comment: db.model("Comment", commentSchema),
        RewardProdcut: db.model("RewardProduct", rewardProductSchema),

        Email: db.model<EmailModel>("Email", emailSchema),
        Order: db.model("Order", orderSchema),
        Complaint: db.model("Complaint", complaintSchema)
    };
};