import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
/**
 * Reward product controller.
 */
export default (config) => {
    const { models } = config;
    async function getAllRewardPts(req: Request, res: Response, next: NextFunction) {
        try {
            return res.status(200).send(await models.RewardPts.find());
        } catch (err) {
            return next(err);
        }
    }
    async function getRewardProduct(req: Request, res: Response, next: NextFunction) {
        try {
            return res.status(200).send(await models.RewardProdcut.find());
        } catch (err) {
            return next(err);
        }
    }
    async function getOneRewardProduct(req: Request, res: Response, next: NextFunction) {
        try {
            return res.status(200).send(await models.RewardProdcut.findById(req.query._id));
        } catch (err) {
            return next(err);
        }
    }
    async function removeRewardProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const productToBeRemoved = req.body.product_id;
            await models.RewardProdcut.remove([].concat(productToBeRemoved).map(p => Types.ObjectId(p), { multi: true }));
            return res.status(200).send({ message: "Removed" });
        } catch (err) {
            return next(err);
        }
    }
    async function removeAllRewardProduct(req: Request, res: Response, next: NextFunction) {
        try {
            await models.RewardProdcut.remove({});
            return res.status(200).send({ message: "Removed" });
        } catch (err) {
            return next(err);
        }
    }
    async function createRewardProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const newProduct = new models.RewardProdcut(req.body);
            await newProduct.save();
            return res.status(200).send({ message: "Created" });
        } catch (err) {
            return next(err);
        }
    }
    async function updateRewardProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const { product_id } = req.body;
            const newProduct = await models.RewardProdcut.findByIdAndUpdate(product_id, { $set: req.body });
            return res.status(200).send({ message: "Updated" });
        } catch (err) {
            return next(err);
        }
    }
    async function purchaseRewardProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const {
                product_id,
                qty,
                delivery
            } = req.body;
            const userId = req["user_id"];
            const rewardProducFound = await models.RewardProdcut.findById(product_id);
            if (!rewardProducFound) { return res.status(400).json({ "message": "Reward product not found." }); }
            if (!qty || rewardProducFound.stock < qty) { return res.status(400).json({ "message": "Insufficient stock." }); }
            const sum: any = await models.RewardPts.aggregate([
                {
                    $match: {
                        buyer_id: Types.ObjectId(userId)
                    }
                },
                {
                    $group: {
                        _id: null,
                        pts: { $sum: "$pts" }
                    }
                },
                {
                    $project: {
                        total: "$pts"
                    }
                }
            ]);
            if (rewardProducFound.pts * qty > sum[0].total) { return res.status(400).send({ "message": "Insufficient reward points." }); }
            const consumption = new models.RewardPts({
                product_id,
                buyer_id: userId,
                delivery,
                qty,
                pts: -rewardProducFound.pts * qty,
                from: "rp"
            });
            await consumption.save();
            await models.RewardProdcut.findByIdAndUpdate(product_id, { $inc: { "stock": -qty } });
            return res.status(200).send({ message: sum });
        } catch (err) {
            return next(err);
        }
    }
    return {
        getRewardProduct,
        removeRewardProduct,
        removeAllRewardProduct,
        createRewardProduct,
        updateRewardProduct,
        purchaseRewardProduct,
        getAllRewardPts
    };
};
