import { isArrayUnique } from "../../_lib/array";
import { NextFunction, Request, Response, Router } from "express";
import { Types } from "mongoose";
import { Config, BuyerModels } from "../../types/app";


export default (config) => {
    const { models } = config;
    function changeStatus(is_active) {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { _id, } = req.query;
                const user = await models.User.findByIdAndUpdate(_id, { $set: { is_active } }).select("credential");
                if (!user) return res.status(409).json({ "message": "User not found." });
                if ("merchant" === user.credential.user_group) await models.Product.update({ "merchant_id": Types.ObjectId(_id) }, { $set: { is_active } }, { multi: true });
                return res.status(200).json({ "message": `Account ${is_active ? "activated" : "suspended"}.` });
            } catch (err) {
                res.status(500);
                return next(err);
            }
        };
    }
    function deleteAccount() {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { _id, } = req.query;
                const userFound = await models.User.findById(_id);
                if (!userFound) return res.status(409).json({ "message": "User not found" });
                const isMerchant = "merchant " === userFound.credential.user_group;
                const merchant = { "merchant_id": Types.ObjectId(_id) };
                const buyer = { "buyer_id": Types.ObjectId(_id) };
                if (userFound.is_active) { return res.status(400).send({ "message": "User needs to be suspended before deletion." }); }
                const pendingOrder = await models.Order.findOne({
                    ...(isMerchant ? merchant : buyer),
                    "status": { $nin: ["GR"] }
                }).lean();
                if (pendingOrder) return res.status(400).send({ "message": "Pending order found" });
                const removedUser = await models.User.findByIdAndRemove(_id);
                if (isMerchant) {
                    await models.Product.remove({ ...(isMerchant ? merchant : buyer) });
                    await models.Variant.remove({ ...(isMerchant ? merchant : buyer) });
                } else {
                    await (<BuyerModels>models).Cart.remove({ ...(isMerchant ? merchant : buyer) });
                    await models.RewardPts.remove({ ...(isMerchant ? merchant : buyer) });
                }
                return res.status(200).json({ "message": "Account is removed" });
            } catch (err) {
                res.status(500);
                return next(err);
            }
        };
    }
    function activateAccount() {
        return changeStatus(true);
    }
    function suspendAccount() {
        return changeStatus(false);
    }
    async function createNewUser(req: Request, res: Response, next: NextFunction) {
        try {
            req.sanitize("email").normalizeEmail({ gmail_remove_dots: false });
            const {
                credential: { email },
                store: { name: storeName },
                profile: { DOB }
            } = req.body;
            const errors = await req.getValidationResult();
            if (!errors.isEmpty()) {
                return res.status(400).send(errors.array({ onlyFirstError: true })[0]);
            }
            const existingUser = await models.User.findOne({ "credential.email": email });
            if (existingUser) {
                return res.status(409).send("Account existed");
            }
            const existingStoreName = await models.User.findOne({ "store.name": storeName });
            if (existingStoreName) {
                return res.status(409).send("Store existed");
            }
            const dateArray = DOB.split("-");
            req.body.profile.DOB = new Date(new Date(dateArray[2], dateArray[1] - 1, dateArray[0]));
            await new models.User(req.body).save();
            return res.status(201).json("User Created");
        } catch (e) {
            res.status(500);
            return next(e);
        }
    }
    async function getUserDetail(req: Request, res: Response, next: NextFunction) {
        const { offset = 0, limit = 5, store_name, _id, user_group, email, name } = req.query;
        const query = {};
        if (email) {
            query["credential.email"] = { $regex: email, $options: "i" };
        }
        if (name) {
            query["profile.first_name"] = { $regex: name, $options: "i" };
        }
        if (user_group) {
            query["credential.user_group"] = user_group;
        }
        if (store_name) {
            query["store.name"] = { $regex: store_name, $options: "i" };
        }
        try {
            if (_id) {
                query["_id"] = Types.ObjectId(_id);
            }
            const result = await models.User.paginate(
                query,
                {
                    lean: true,
                    offset: Number(offset),
                    limit: Number(limit),
                    select: "+credential"
                });
            if (_id) {
                result.docs[0]["product_count"] = await models.Product.count({ merchant_id: Types.ObjectId(_id) });
                await models.Category.populate(result.docs, { path: "commission.category_id" });
            }
            return res.status(200).send(result);
        } catch (err) {
            return next(err);
        }
    }
    async function updateUserDetail(req: Request, res: Response, next: NextFunction) {
        try {
            const { profile, bank, store, credential } = req.body;
            const user = await models.User.findById(req.query._id).select("credential.password");
            user.profile = profile;
            user.bank = bank;
            user.credential.password = credential.password;
            user.store = store;
            await user.save().catch((error) => res.status(200).json({ message: "Gender is requried" }));
            return res.status(200).json({ message: "User updated!" });
        } catch (err) {
            res.status(500);
            return next(err);
        }
    }
    async function updateMerchantAssignedCommission(req: Request, res: Response, next: NextFunction) {
        try {
            const { category, rate, merchant_id } = req.body;
            const pathFound = await models.Category.find({ "path": { $regex: `^${category}` } });
            const merchant = await models.User.findById(merchant_id).select("commission");
            const commission = pathFound.map(p => ({ category_id: p._id, rate: rate as number }));
            merchant.commission.push(...commission);
            if (!isArrayUnique(merchant.commission.map(c => c.category_id.toHexString()))) { return next("Duplicated category commission setting!"); }
            await merchant.save();
            await models.Category.populate(merchant, { path: "commission.category_id" });
            return res.status(200).send(merchant);
        } catch (error) {
            return next(error);
        }
    }
    async function deleteMerchantAssignedCommission(req: Request, res: Response, next: NextFunction) {
        try {
            const { category, merchant_id } = req.body;
            const updated = await models.User.findByIdAndUpdate(merchant_id, { $pull: { commission: { category_id: { $in: category } } } }, { new: true }).select("commission").lean();
            await models.Category.populate(updated, { path: "commission.category_id" });
            return res.status(200).send(updated);
        } catch (error) {
            return next(error);
        }
    }
    async function getBuyerCreditWalletList(req: Request, res: Response, next: NextFunction) {
        try {
            const records = await models.CreditWallet.aggregate(
                // Limit to relevant documents and potentially take advantage of an index
                [
                    {
                        $group: {
                            "_id": "$buyer_id",
                            "total": { "$sum": "$amount" },
                            "updatedAt": { $last: "$updatedAt" }
                        }
                    },
                    {
                        $project: {
                            "_id": 0,
                            "buyer_id": "$_id",
                            "total": "$total",
                            "updatedAt": "$updatedAt"
                        }
                    }
                ]
            );
            const poplutatedRecords = await models.User.populate(records, { path: "buyer_id" });
            return res.status(200).send(poplutatedRecords);
        } catch (error) {
            return next(error);
        }
    }
    async function getBuyerCreditWallet(req: Request, res: Response, next: NextFunction) {
        try {
            const { buyer_id } = req.params;
            console.log(`Recevied ${buyer_id}=>converted to ${Types.ObjectId(buyer_id)}`);
            const findTotal = await models.CreditWallet.aggregate(
                [
                    {
                        $match: {
                            "buyer_id": Types.ObjectId(buyer_id)
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
                    "history": await models.CreditWallet.find({ "buyer_id": Types.ObjectId(buyer_id) }),
                    ...findTotal[0],
                }
            });
        } catch (error) {
            return next(error);
        }
    }
    async function addNewEntryToBuyerCreditWallet(req: Request, res: Response, next: NextFunction) {
        try {
            if (!await models.User.findById(req.params.buyer_id)) res.status(404).send({ "message": "No such user found" });
            const newEntry = new models.CreditWallet({
                ...req.body,
                ...req.params
            });
            await newEntry.save();
            return res.status(200).send({
                "message": "Credit modified."
            });
        } catch (error) {
            return next(error);
        }
    }
    return {
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
    };
};