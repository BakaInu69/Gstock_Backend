import { OrderModel } from "../models/Schemas/Order";
import { Model } from "mongoose";

export class OrderRepostiory {
    Order: Model<OrderModel>;
    constructor(private OrderModel ) {
        this.Order = OrderModel;
    }
    getOrderById(orderId) {
        return this.Order.findById(orderId);
    }
    getOrderByQuery(query) {
        return this.Order.find(query);
    }
    buyerGetOrder(buyerId, orderId?) {
        const populate = [{
            path: "merchant_id",
            select: "store",
            // model: User
        },
        {
            path: "promotions._id",
            select: "",
            // model: Promotion
        }];
        if (orderId) return this.getOrderById(orderId).populate(populate);
        return this.getOrderByQuery(buyerId).populate(populate).sort("-createdAt").select("-commission_status -products.purchase -total.commission");
    }
    merchantGetOrder(query, orderId?) {
        const populate = {
            path: "buyer_id",
            select: "profile credential.email",
            // model: User
        };
        if (orderId) return this.getOrderById(orderId).populate(populate);
        return this.getOrderByQuery(query).populate(populate).sort("-createdAt");
    }
    adminGetOrder(query, orderId?) {
        const populate = {
            path: "buyer_id merchant_id",
            select: "contact profile credential.email",
            // model: User
        };
        if (orderId) return this.getOrderById(orderId).populate(populate);
        return this.getOrderByQuery(query).populate(populate).sort("-createdAt");
    }
    selectBetween(field, start, end) {
        const r = {};
        return r[field] = { $gte: start, $lte: end };
                // if (order_id) {
                //     const orders = await Order.findById(order_id).populate(populate);
                //     return res.status(200).send(orders);
                // }
                // const orders = await Order.find(query).populate(populate).sort("-createdAt").select("-commission_status -products.purchase -total.commissio");
    }
}