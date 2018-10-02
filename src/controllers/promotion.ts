import { NextFunction, Request, Response } from "express";
import * as _ from "lodash";
import { Types } from "mongoose";
import { toArrayOfObjectId } from "./../_lib/toArrayOfObjectId";
/**
 * Promotion controller.
 */
export default (config) => {
    const {
        Promotion,
        User,
        Category,
        Order
    } = config.models;
    const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { promotion_id } = req.query;
            const promotion = await Promotion.findById(promotion_id);
            let updated;
            if (promotion) {
                const now  = new Date();
                const { status } = promotion;
                const start = new Date(promotion.start);
                const end = new Date(promotion.end);
                if ("Inactive" !== status) {
                    promotion.status = "Inactive";
                }
                else if (start < now && end > now) {
                    promotion.status = "Active";
                }
                else if (start > now) {
                    promotion.status = "Scheduled";
                }
                else if (end < now) {
                    return res.status(400).send({
                        mesasge: "Update failed",
                        detail: "Invalid date"
                    });
                }
                updated = await promotion.save();
            }
            return res.status(200).send(updated);
        } catch (error) {
            return next(error);
        }

    };
    return {
        verifyPromoCode: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { promo_code } = req.query;

                const promotion = await Promotion.findOne({ promo_code, status: "Active" }).lean();
                if (!promotion) { return res.status(400).send({ "message": "This promotion is not available." }); }
                if (promotion.first_order) {
                    if (await Order.findOne({
                        buyer_id: res.locals.user.id,
                        "promotions._id": promotion._id
                    })) { return res.status(400).send({ "message": "You have used this promotion in previous order" }); }
                }
                // const promotions = await Promotion.findOne(Object.assign({ promo_code: promo_code  }, !order ? {} : { first_time: false }));
                return res.status(200).send(promotion);
            }
            catch (e) {
                res.status(400);
                return next(e);
            }
        },
        createNewPromotion: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const {
                    name,
                    detail,
                    value,
                    kind,
                    promo_type,
                    start,
                    end,
                    promo_code,
                 } = req.body;
                if (start >= end) return res.status(400).send({ message: "Start date is later than end date." });
                if (await Promotion.findOne({ promo_code })) return res.status(409).send({ message: "Promotion code existed." });
                await new Promotion({
                    name,
                    detail,
                    value,
                    kind,
                    promo_type,
                    start,
                    end,
                    promo_code,
                }).save();
                return res.status(201).json({ message: "Promotion created" });
            } catch (e) {
                return res.status(400).send(e);
            }
        },
        getPromotion: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { promotion_id, status } = req.query;
                if (status) {
                    let queryCondition = {};
                    switch (status) {
                        case "All":
                            break;
                        case "Inactive":
                            queryCondition = { "status": "Inactive" };
                            break;
                        case "Active":
                            queryCondition = { "status": { $ne: "Inactive" }, start: { $lte: new Date() }, end: { $gte: new Date() } };
                            break;
                        case "Scheduled":
                            queryCondition = { "status": { $ne: "Inactive" }, start: { $gte: new Date() } };
                            break;
                        case "Expired":
                            queryCondition = { "status": { $ne: "Inactive" }, end: { $lte: new Date() } };
                            break;
                        default: return res.status(400).send({ message: "Unkown status" });
                    }
                    return res.status(200).send(await Promotion.find(queryCondition));
                }
                const promotion = await Promotion.findById(promotion_id).sort("-updatedAt");
                if ("merchant" === promotion.kind) {
                    await User.populate(promotion, { path: "target", select: "store.name" });
                }
                if ("buyer" === promotion.kind) {
                    await Category.populate(promotion, { path: "target", select: "path" });
                }
                return res.status(200).send(promotion);
            } catch (e) {
                return next(e);
            }
        },
        updatePromotion: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { promotion_id } = req.query;
                if (!promotion_id) { return next("Invalid promotion"); }
                const promotion = await Promotion.findById(promotion_id);
                if (!promotion) { return next("invalid promotion"); }
                const { kind, promo_type, target, start, end, status } = req.body;
                req.body.target = target.map(t => Types.ObjectId(t));
                console.log(status, new Date(start as string) < new Date(), new Date(end as string) > new Date());
                if ("Inactive" === status) {
                    req.body.status = "Inactive";
                }
                else if (new Date(start as string) < new Date(), new Date(end as string) > new Date()) {
                    req.body.status = "Active";
                }
                else if (new Date(start as string) > new Date()) {
                    req.body.status = "Scheduled";
                }
                else if (new Date(end as string) < new Date()) {
                    req.body.status = "Expired";
                }
                await Promotion.findByIdAndUpdate(promotion_id, { $set: req.body });
                return res.status(200).send({ message: "Promotion updated" });
            } catch (error) {
                return next(error);
            }
        },
        deletePromotion: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { promotion_id } = req.query;
                const promotionIds = toArrayOfObjectId([].concat(promotion_id));
                await Promotion.remove(promotionIds);
                return res.status(200).send({ message: "Promotions removed" });
            } catch (error) {
                return next(error);
            }
        },
        updateStatus
    };
};
