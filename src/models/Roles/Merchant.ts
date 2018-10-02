
import * as mongoosePaginate from "mongoose-paginate";
import { Model, Document, Connection, Types, PaginateModel } from "mongoose";
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
import { EmailModel } from "../Schemas/Email";
import { UserModel } from "../Schemas/User";
import { ProductModel } from "../Schemas/Product";
export default (db: Connection) => {
        return {
            User: db.model("User", userSchema) as PaginateModel<UserModel>,
            Product: db.model("Product", productSchema) as PaginateModel<ProductModel>,
            Category: db.model("Category", categorySchema),
            Attribute: db.model("Attribute", attributeSchema),
            Variant: db.model("Variant", variantSchema),
            Comment: db.model("Comment", commentSchema),
            Email: db.model<EmailModel>("Email", emailSchema),
            ProductAttribute: db.model("ProductAttribute", productAttributeSchema),
            Order: db.model("Order", orderSchema),
            PendingStock: db.model("PendingStock", pendingStockSchema),
            Complaint: db.model("Complaint", complaintSchema)
     };
};
