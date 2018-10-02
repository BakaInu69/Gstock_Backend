import { NextFunction, Request, Response } from "express";
import * as _ from "lodash";
import { Types } from "mongoose";
import { db } from "./../firebase";
/**
 * Comment controller.
 */
export default (config) => {
    const { models } = config;
    return {
        getComments: async (product_id) => {
            try {
                const comments = await models.Comment
                    .find(
                        {
                            "product_id": product_id
                        })
                    .populate("buyer_id", "profile", models.User)
                    .sort("createdAt")
                    .lean();
                return comments;
            } catch (error) {
                return error;
            }
        },
        postComments: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { product_id, order_id } = req.query;
                const { comment, rating } = req.body;
                const verified = await models.Order.findOne({
                    "_id": Types.ObjectId(order_id),
                    buyer_id: req["user_id"],
                    status: "GR"
                });
                if (!verified) return next("Only verified buyer can comment.");
                const commented = await models.Comment.find({
                    order_id: Types.ObjectId(order_id),
                    product_id: Types.ObjectId(product_id),
                    buyer_id: req["user_id"],
                    comment: { $exists: true }
                });
                if (commented.length) return next("You have commented on this order.");
                const newComment = await new models.Comment({
                    comment,
                    rating,
                    buyer_id: req["user_id"],
                    order_id: Types.ObjectId(order_id),
                    product_id: Types.ObjectId(product_id)
                }).save();

                const updated = await models.Order.findOneAndUpdate(
                    {
                        _id: Types.ObjectId(order_id),
                        "products.product._id": Types.ObjectId(product_id)
                    }, {
                        $set: { "products.$.comment_id": newComment.id }
                    }, {
                        upsert: true
                    });
                console.log("???", updated);
                if (!updated) return next("No such product found");
                return res.status(200).send("Commented");
            } catch (err) {
                return next(err);
            }

        }
    };
};
