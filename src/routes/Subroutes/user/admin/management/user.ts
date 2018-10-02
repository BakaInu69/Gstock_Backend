import { NextFunction, Request, Response, Router } from "express";
import { check } from "express-validator/check";
import { userMgmtController } from "../../../../../controllers";
/**
 * User management
 */

export default (config) => {
    const {
        createNewUser,
        getUserDetail,
        updateUserDetail,
        updateMerchantAssignedCommission,
        deleteMerchantAssignedCommission,
        getBuyerCreditWalletList,
        getBuyerCreditWallet,
        addNewEntryToBuyerCreditWallet,
        changeStatus,
        deleteAccount,
        activateAccount,
        suspendAccount
    } = userMgmtController(config);
    return Router()
        .delete("/", deleteAccount())
        .post("/create", [
            check("credential.email", "Email is not valid").isEmail(),
            check("credential.password", "Password must be at least 4 characters long").isLength({ min: 4 }),
            // check("credential.confirm_password", "Passwords do not match").equals(req.body.credential.password),
            check("credential.user_group", "User group must be defined").exists(),
        ], createNewUser)
        .get("/detail", getUserDetail)
        .put("/detail", updateUserDetail)
        .put("/commission", updateMerchantAssignedCommission)
        .post("/commission/delete", deleteMerchantAssignedCommission)
        .put("/activate/merchant", activateAccount())
        .put("/suspend/merchant", suspendAccount())
        .put("/activate/buyer", activateAccount())
        .put("/suspend/buyer", suspendAccount())
        .get("/credit_list", getBuyerCreditWalletList)
        .get("/credit/:buyer_id", getBuyerCreditWallet)
        .post("/credit/:buyer_id", addNewEntryToBuyerCreditWallet);

};

