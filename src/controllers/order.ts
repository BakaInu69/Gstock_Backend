import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";

// import { Config } from "./../app";
import { sendEmail } from "./../emailTemplate/email_manager";
import { db } from "./../firebase";
import commentCtrl from "./comment";
import { ORDER_STATUS, PRODUCT_STATUS, COMMISSION_STATUS } from "./../../src/_status/status";
import { calculateDiscountPrice } from "../_global/business";
// import { MerchantCommission } from "../models/Schemas/";
// import { Models } from "../models/Schemas";
import { BuyerModels, Config } from "../types/app";
import { MerchantCommission } from "../models/Schemas/User";
import { OrderService } from "../services/order.service";
const debug = require("debug")("gstock:controller");

type OrderAccepted = {
    carts: Array<string>;
    orders:
    [{
        merchant_id: string,
        products: [{
            product_id: string;
            "variants": [
                {
                    cart_id: string,
                    variant_id: string;
                    "qty": number
                }
            ]
        }],
        delivery: {
            "address": string;
            "unit_no": string;
            "postal_code": string;
            "bill_to": string;
            "recepient": string;
            "contact_no": string;
            "shipping_fee": number;
            "shipping_type": string;
        }
    }];
    delivery: {
        "address": string;
        "unit_no": string;
        "postal_code": string;
        "bill_to": string;
        "recepient": string;
        "contact_no": string;
        "shipping_fee": number;
        "shipping_type": string;
    };
    promo_codes: Array<string>;
};
/*}
 * Order controller.
 */


export class OrderController {
    models;
    orderService: OrderService ;


    constructor(private config: Config) {

        this.models = config.models;
        this.orderService = new OrderService(this.models);
    }

    decimal(num, sf = 2) {
        return Math.round(num * Math.pow(10, sf)) / Math.pow(10, sf);
    }
    async getOrderDetail(req: Request, res: Response, next: NextFunction) {
        try {
            const {
                // promo_codes: promoCodes,
                orders
            } = req.body as OrderAccepted;
            // opt: embed merchant, category and variant doc into product doc
            // opt: Q merchant commission for later processing
            const {
                User,
                Product,
                Category,
                Variant,
                Order,
                RewardPts,
                Cart,
                Complaint
            } = this.models;
            await User.populate(orders, { path: "merchant_id", select: "commission" });
            await Product.populate(orders, { path: "products.product_id", select: "merchant_id brief pricing category_id" });
            await User.populate(orders, { path: "products.product_id.merchant_id", select: "commission" });
            await Category.populate(orders, { path: "products.product_id.category_id", select: "commission" });
            await Variant.populate(orders, { path: "products.variants.variant_id" });
            orders.forEach(o => {
                if (!o.merchant_id) throw("Could not find merchant");
                o.products.forEach(p => {
                        if (p.product_id["merchant_id"]["_id"].toString() !== o.merchant_id["_id"].toString()) {
                            throw("The merchant does not sell this product");
                        }
                });
            });
            res.locals.orderDetails = orders;
            return next();
        } catch (error) {
            return res.status(400).send({msg: error});
        }
    }
    // async  validateOrderDetail(req: Request, res: Response, next: NextFunction) {
    //     res.locals.orderDetails.forEach(
    //         o =>
    //     );
    // }
    async  getPromotionDetailFromPromoCode(req: Request, res: Response, next: NextFunction) {
        const {
            User,
            Product,
            Category,
            Variant,
            Order,
            RewardPts,
            Cart,
            Complaint,
            Promotion
        } = this.models;
        try {
            const { promo_codes: promoCodes } = req.body as OrderAccepted;
            const promotions = await Promotion.find({ promo_code: { $in: promoCodes }, status: "Active" });

            const firstOrderOnlyPromo = promotions.filter(p => p.first_order);
            if (firstOrderOnlyPromo.length) {
                const order = await Order.findOne({
                    buyer_id: res.locals.user.id,
                    "promotion.promo_code": { $in: firstOrderOnlyPromo.map(f => f.promo_code) }
                });
                if (order) { return res.status(400).send({ "message": "You have used promotion code." }); }
            }
            res.locals.promotions = promotions;
            next();
        } catch (error) {
            throw ("Failed to verify promotion codes");
        }
    }
     processStore(req: Request, res: Response, next: NextFunction) {
        const {
            User,
            Product,
            Category,
            Variant,
            Order,
            RewardPts,
            Cart,
            Complaint,
            Promotion
        } = this.models;
        const userId = res.locals.user.id;
        const {
            orderDetails,
            promotions
        } = res.locals;
        const carts = [];
        const ordersForReport = orderDetails.map(
            store => {
                const {
                    memo,
                    merchant_id: {
                        _id: merchantId
                    },
                    delivery
                } = store;
                const {
                    cart,
                    products,
                    freeShipping
                } = this.processProducts(store, promotions);
                carts.push(...cart);
                const total = this.calculateTotal(products);
                const {
                    product_total_bp: productTotalBefPromo,
                    product_total_ap: productTotalAftPromo,
                    commission_amount: commissionAmount
                } = total;
                total["store_bp"] = productTotalBefPromo;
                total["store_ap"] = productTotalAftPromo;
                total["commission"] = commissionAmount;
                Object.keys(total).forEach(k => total[k] = this.decimal(total[k]));
                return {
                    memo,
                    buyer_id: userId,
                    merchant_id: merchantId,
                    free_shipping: freeShipping,
                    delivery: delivery ? delivery : req.body.delivery,
                    products,
                    total,
                    promotions
                };
            });
        res.locals.cart = carts;
        res.locals.orderForReport = ordersForReport;
        next();
    }
     processProducts(store, promotions) {
        const cart = [];
        let freeShipping = false;
        const products = store.products
            .map(p => {
                console.log("product", p);
                // product["_id"] = productId;
                // const commission = calculateCommission(category, specialCommissionAssignedToMerchant);
                const {
                    freeShipping: free_shipping,
                    product_total_bp,
                    product_total_ap,
                    variantsAftProc,
                    cart: cartsFromVariant,
                    total_commission: commission,
                    total_reward_pts: reward_pts
                } = this.processVariants(store, p, promotions);
                if (freeShipping || free_shipping) { freeShipping = true; }
                cart.push(...cartsFromVariant);
                return {
                    purchase: {
                        product_total_bp,
                        product_total_ap,
                        commission,
                        commission_amount: product_total_bp * commission / 100,
                        /* total * commission_rate * reward_pts_rate * 100 */
                        reward_pts
                        // : calculateRewardPts(product_total_bp, commission, 0.05)
                    },
                    product: p.product_id,
                    variants: variantsAftProc,
                };
            });
        return {
            products,
            cart,
            freeShipping
        };
    }
     processVariants(store, baseProduct, promotions) {
        const {
            merchant_id: {
                _id: merchantId,
                commission: specialCommissionAssignedToMerchant
            }
        } = store;
        const {
            product_id: product,
            variants: variantsBefProc
        } = baseProduct;
        const {
            category_id: category,
            category_id: {
                _id: categoryId
            },
            brief: {
                discount,
                price: priceBefDiscount,
            },
            pricing: {
                discount_rate,
            }
        } = product;
        const variantsHolder = [];
        const cart = [];
        let product_total_bp = 0;
        let product_total_ap = 0;
        let total_commission = 0;
        let total_reward_pts = 0;
        let freeShipping = false;
        variantsBefProc.forEach(
            (v) => {
                const {
                    variant_id: variant,
                    qty,
                    cart_id
                } = v;
                const price = variant ? variant["price"] : priceBefDiscount;
                const priceAftDiscount = this.decimal(discount ? calculateDiscountPrice(price, discount_rate) : price);
                let toPush = { "order_qty": qty };
                const totalPriceAfterDiscount = priceAftDiscount * qty;
                product_total_bp += totalPriceAfterDiscount;
                const commission = this.decimal(this.calculateCommission(category, specialCommissionAssignedToMerchant) * totalPriceAfterDiscount);
                total_commission += commission;
                const priceAftDiscountAndCommission = totalPriceAfterDiscount - commission;
                const reward_pts = this.decimal(this.calculateRewardPts(priceAftDiscountAndCommission, 0.05));
                total_reward_pts += reward_pts;
                const {
                    product_ap,
                    free_shipping
                } = this.calPriceAftPromo(promotions, categoryId, merchantId, priceAftDiscount);
                if (free_shipping || freeShipping) { freeShipping = free_shipping; }
                product_total_ap += product_ap * qty;
                if (undefined !== variant) toPush = {
                    ...toPush,
                    ...variant.toObject(),
                    commission,
                    reward_pts,
                };
                variantsHolder.push(toPush);
                cart.push(cart_id);
            }
        );
        return {
            cart,
            total_commission,
            total_reward_pts,
            product_total_ap,
            product_total_bp,
            variantsAftProc: variantsHolder,
            freeShipping
        };
    }
    async  removeItemFromCart(cart, user_id) {
        const carts = cart.map(c => Types.ObjectId(c));
        try {
            return await this.models.Cart.remove({
                _id: { $in: carts },
                buyer_id: Types.ObjectId(user_id)
            });
        } catch (error) {
            throw (error);
        }
    }
    async  updatePendingStock(ordersInserted, pending_stock) {
        const r = pending_stock.map(e =>
            ({
                order_id: ordersInserted.find(o => o.merchant_id.equals(e.merchant_id))._id,
                ...e
            })
        );
        await Promise.all(
            r.map((l) => this.models.Product.findByIdAndUpdate(l.product_id, {
                $push: {
                    "stock.pending": l
                }
            })));
        return r;
    }
    async  updateRewardPts(ordersInserted, user_id) {
        let totalPts = 0;
        const rewardPts = ordersInserted.map(
            o => {
                totalPts += o.total.reward_pts;
                return {
                    buyer_id: user_id,
                    order_id: o._id,
                    pts: o.total.reward_pts,
                    status: "Pending"
                };
            }
        );
        await this.models.RewardPts.insertMany(rewardPts);
        return totalPts;
    }
    async  sendEmailAndNotification(user, payload) {
        const {
            orderStatus,
            ordersInserted: orders,
            totalRewardPts
        } = payload;
        sendEmail("NEW_ORDER", user, { totalRewardPts });
        await this.sendEmailAndNotificationToMerchant("MER_ORDER", user, { orders, orderStatus });
    }
    async  sendEmailAndNotificationToMerchant(emailType, merchant, payload) {
        const {
            orderStatus,
            orders,
            totalRewardPts
        } = payload;
        sendEmail("MER_ORDER", merchant, { orderStatus });
        const newNewsKey = db.ref("/news").push().key;
        const updates = {};
        return Promise.all(orders.map((m) => {
            updates[`/news/${m.merchant_id}/${newNewsKey}`] = {
                "order_id": m._id,
                "type": "order",
                "create_date": new Date(),
                "read": false,
                "status": orderStatus
            };
            return db.ref("/").update(updates);
        }));
    }
    // async  sendEmailAndNotification(ordersInserted, user_id, totalRewardPts) {
    //     const user = await User.findById(user_id);
    //     console.log(totalRewardPts);
    //     sendEmail("NEW_ORDER", user, { totalRewardPts: totalRewardPts });
    //     sendEmail("MER_NEW_ORDER", user, { totalRewardPts: totalRewardPts });
    //     const newNewsKey = db.ref("/news").push().key;
    //     const updates = {};
    //     await Promise.all(ordersInserted.map((m) => {
    //         updates[`/news/${m.merchant_id}/${newNewsKey}`] = {
    //             "order_id": m._id,
    //             "type": "order",
    //             "create_date": new Date(),
    //             "read": false,
    //             "status": "Pending"
    //         };
    //         return db.ref("/").update(updates);
    //     }));
    // }
     calPriceAftPromo(promotions, categoryId, merchantId, up) {
        let totalPromo = 0;
        let fs = false;
        if (promotions && !promotions.length) {
            return {
                free_shipping: false,
                product_ap: up
            };
        }
        promotions.forEach(promotion => {
            const { freeShipping, accPromoAmt } = this.productPromotionAmt(up, promotion, categoryId, merchantId);
            totalPromo += accPromoAmt;
            fs = freeShipping;
        });
        // const { product_ap, freeShipping } = ;
        return {
            free_shipping: fs,
            product_ap: up - totalPromo
        };
    }
     productPromotionAmt(product_bp, promotion, categoryId, merchantId) {
        const { kind, promo_type, value } = promotion;
        switch (kind) {
            case "storewide": {
                debug("This is a store wide");
                const { freeShipping, accPromoAmt } = this.computePromoAmt(product_bp, promo_type, value);
                debug("This is a store wide", freeShipping);
                return {
                    accPromoAmt,
                    freeShipping
                };
            }
            case "category": {
                console.log("This is a promotion by category");
                const found = promotion.target.findIndex(e => e === categoryId);
                if (found > 0) {
                    const { freeShipping, accPromoAmt } = this.computePromoAmt(product_bp, promo_type, value);
                    return {
                        accPromoAmt,
                        freeShipping
                    };
                }
                break;
            }
            case "merchant": {
                console.log("This is a promotion by merchant");
                console.log(`Checking if ${merchantId} is participating in promotion`);
                const found = promotion.target.findIndex((e: Types.ObjectId) => e.equals(merchantId));
                if (found > 0) {
                    console.log("Yes he is", found);
                    const { freeShipping, accPromoAmt } = this.computePromoAmt(product_bp, promo_type, value); accPromoAmt;
                } else {
                    console.log("This merchant is not participating in promotion.", promotion);
                }
                return {
                    accPromoAmt: 0,
                    freeShipping: false
                };
            }
            default: throw ("unkown promotion kind");
        }
        // console.log(`Product price before promotion is ${product_bp}. After checking all promotion, the total deduction amount is ${totalPromo}. Product price after promotion is ${product_bp - totalPromo}`);
        // return {
        //     product_ap: product_bp - totalPromo,
        //     freeShipping: fs
        // };
    }
     computePromoAmt(price, promoType, value) {
        console.log(`Received product price is ${price}, promotion type is ${promoType} the value is ${value}`);
        let freeShipping = false;
        let accPromoAmt = 0;
        switch (promoType) {
            case "fs": {
                freeShipping = true;
                break;
            }
            case "pd": {
                accPromoAmt = this.decimal(price * Number.parseFloat(value) / 100);
                console.log(`A product with price ${price} after ${value}% of discount is ${accPromoAmt}`);
                break;
            }
            case "fa": {
                accPromoAmt = Number.parseFloat(value);
                break;
            }
        }
        return {
            freeShipping,
            accPromoAmt,
        };
    }
     calculateTotal(products) {
        return products.map(e => e.purchase).reduce(
            (a, b) => ({
                reward_pts: a.reward_pts + b.reward_pts || 0,
                commission_amount: a.commission_amount + b.commission_amount || 0,
                product_total_bp: a.product_total_bp + b.product_total_bp || 0,
                product_total_ap: a.product_total_ap + b.product_total_ap || 0,
            }));
    }
     calculateRewardPts(priceAftDiscountAndCommission, rewardRate) {
        return priceAftDiscountAndCommission * rewardRate * 100;
    }
     calculateCommission(category, specialCommissionAssignedToMerchant: [MerchantCommission]) {
        if (!category) { throw ("Invalid category"); }
        const defaultRate = category["commission"];
        const specialRate = specialCommissionAssignedToMerchant.find(s => s.category_id.equals(category._id));
        return specialRate ? specialRate.rate / 100 : defaultRate / 100;
    }
    async  placeOrder(req: Request, res: Response, next: NextFunction) {
        // a lot complicated lookup and requries no optimization
        try {
            const {
                orderDetails,
                promotions,
                cart,
                orderForReport,
                user
            } = res.locals;
            const ordersInserted = await this.models.Order.insertMany(orderForReport);
            const totalRewardPts = await this.updateRewardPts(ordersInserted, user.id);
            await this.removeItemFromCart(cart, user.id);
            const order_id = [].concat(ordersInserted).map(o => o._id);
            // await sendEmailAndNotification(user, { orderStatus: "Pending", ordersInserted, totalRewardPts });
            return res.status(200).json({orders: order_id});
            // return res.status(200).send(res.locals);
        } catch (error) {
            return next(error);
        }
    }
    buyerGetOrder() {
        return this.getOrder("buyer");
    }
    adminGetOrder() {
        return this.getOrder("admin");
    }
     getOrder(role) {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                const {
                    select,
                    order_id,
                    start,
                    end
                } = req.query;
                const query = {};
                if (start && end) {
                    const endDate = new Date(end);
                    endDate.setHours(23, 59, 59, 999);
                    query["createdAt"] = { $gte: new Date(start), $lte: endDate};
                }
                switch (role) {
                    case "buyer": {
                        query["buyer_id"] = res.locals.user._id;
                        const orders = await this.orderService.buyerGetOrder(query, order_id );
                        return res.status(200).send(orders);
                    }
                    case "merchant": {
                        query["merchant_id"] = res.locals.user._id;
                        const orders = await this.orderService.merchantGetOrder(query, order_id);
                        return res.status(200).send(orders);
                    }
                    case "admin": {
                        const orders = await this.orderService.adminGetOrder(query, order_id);
                        return res.status(200).send(orders);
                    }
                    default: throw ("No such role");
                }
            } catch (error) {
                return res.status(400).send(error);
            }
        };
    }
    async  merchantCancelOrder(req: Request, res: Response, next: NextFunction) {
    }
    async  buyerMadePayment(req: Request, res: Response, next: NextFunction) {
        const {
            User,
            Product,
            Category,
            Variant,
            Order,
            RewardPts,
            Cart,
            Complaint,
            Promotion
        } = this.models;
        try {
            const {
                order_id,
                paypal
            } = req.body;
            const orderIds = [].concat(order_id).map(o => Types.ObjectId(o));
            const ordersPendingPayment = await Order.find({
                _id: { $in: orderIds },
                buyer_id: res.locals.user.id,
                status: ORDER_STATUS.Pending
            });
            if (orderIds.length !== ordersPendingPayment.length) {
                return res.status(400).send({message: "Found invalid order. Please contact admins."});
            }
            await Order.update({
                _id: { $in: orderIds },
                buyer_id: res.locals.user.id
            }, {
                $set: {
                    status: ORDER_STATUS.Paid,
                    commission_status: COMMISSION_STATUS.Approved,
                    paypal
                }
            }, { multi: true, });
            // sendEmailAndNotificationToMerchant("MER_ORDER", res.locals.user, ORDER_STATUS.Paid);
            // const pendingStock = await getPendingStock(orderIds);
            // await substractPendingStock(pendingStock);
            // await RewardPts.update({ order_id: { $in: orderIds } }, { $set: { status: "Awarded" } }, { multi: true });
            // return res.status(200).json({ "message": "Status update to paid and reward points credited." });
            res.locals.orderIds = orderIds;
            next();
        } catch (error) {
            debug(error.message);
            return res.status(400).send({"message": error.message});
        }
    }
    async  getPendingStock(req: Request, res: Response, next: NextFunction) {
        res.locals.pendingStock = await this.models.Order.aggregate(
            {
                $match: {
                    "status": { $eq: "Paid" },
                    "_id": { $in:  res.locals.orderIds }
                }
            },
            {
                $unwind: "$products"
            },
            {
                $unwind: "$products.variants"
            },
            {
                $group: {
                    "_id": "$products.product._id",
                    result: {
                        $push: {
                            product_id: "$products.product._id",
                            variant_id: "$products.variants._id",
                            "total": { $sum: "$products.variants.order_qty" }
                        }
                    }
                }
            },
            {
                "$unwind": "$result"
            },
            {
                $project: {
                    product_id: "$result.product_id",
                    variant_id: "$result.variant_id",
                    "total": "$result.total"
                }
            }
        ).exec();
        debug("Calculating pending stock", res.locals.pendingStock);
        next();
    }
    async  substractPendingStock(req: Request, res: Response, next: NextFunction) {
        const {
            User,
            Product,
            Category,
            Variant,
            Order,
            RewardPts,
            Cart,
            Complaint,
            Promotion
        } = this.models;
        const variant = [];
        const product = [];
        const r = await Promise.all(res.locals.pendingStock.map(p => {
            const {
                product_id: productId,
                variant_id: variantId,
                total } = p;
            if (!variantId) {
                product.push(Types.ObjectId(productId));
                return Product.findByIdAndUpdate(productId, { $inc: { "brief.stock": -total, "stock.qty": -total } });
            } else {
                variant.push(Types.ObjectId(variantId));
                return Variant.findByIdAndUpdate(variantId, { $inc: { "stock": -total } });
            }
        }));
        await Product.update({ _id: { $in: product }, "brief.stock": { "$lte": 0 } }, { $set: { is_active: false } });
        await Variant.update({ _id: { $in: variant }, "stock": { "$lte": 0 } }, { $set: { is_active: false } });
        next();
    }
    async  buyerConfirmOrder(req: Request, res: Response, next: NextFunction) {
        const {
            User,
            Product,
            Category,
            Variant,
            Order,
            RewardPts,
            Cart,
            Complaint,
            Promotion
        } = this.models;
        try {
            const { order_id } = req.body;
            const buyerId = res.locals.user.id;
            debug(buyerId, order_id);
            const order = await Order.findOne(
                {
                    "_id": Types.ObjectId(order_id),
                    "buyer_id": Types.ObjectId(buyerId)
                });
            if (!order) { return res.status(400).send({"message": "No such order"}); }
            if (ORDER_STATUS.Delivering !== order.status) return res.status(400).send({"message": "Invalid order status"});
            order.status = ORDER_STATUS.GoodReceived;
            order.commission_status = COMMISSION_STATUS.Released;
            await order.save();
            return res.status(200).send({"message": "Item delivered and received."});
        } catch (error) {
            return next(error);
        }
    }
    async  merchantProccedToNextStageOfOrder(req: Request, res: Response, next: NextFunction) {
        const {
            User,
            Product,
            Category,
            Variant,
            Order,
            RewardPts,
            Cart,
            Complaint,
            Promotion
        } = this.models;
        try {
            const { shipment_id, order_id } = req.body;
            const user_id = req["user_id"];
            const order = await Order.findById(order_id);
            switch (order["status"]) {
                case ORDER_STATUS.GoodReceived:
                    return res.status(200).send({"message": "Goods have already benn received."});
                case ORDER_STATUS.AwaitingDelivery:
                    if (!shipment_id) return res.status(400).send({"message": "Shipment id is required"});
                    await Order.findByIdAndUpdate(order_id, {
                        $set: {
                            "delivery.shipment_id": shipment_id,
                            "status": ORDER_STATUS.Delivering
                        }
                    });
                    return res.status(200).send({"message": "Sending request to detemine if good is delivered"});
                case ORDER_STATUS.Delivering:
                    return res.status(200).send({"message": "Goods are delivering"});
                case ORDER_STATUS.Paid:
                    await Order.findByIdAndUpdate(order_id, shipment_id ? {
                        $set: {
                            "delivery.shipment_id": shipment_id, "status": ORDER_STATUS.Delivering
                        }
                    } : { $set: { "status": ORDER_STATUS.AwaitingDelivery } });
                    return res.status(200).send({"message": "Your item status has been changed"});
                default:

                    return res.status(400).send({"message": "Invalid status for operation"});
            }

        } catch (error) {
            console.log(error);
            return res.status(400).send(error);
        }
    }
    async  buyerPostComplaint(req: Request, res: Response, next: NextFunction) {
        const {
            User,
            Product,
            Category,
            Variant,
            Order,
            RewardPts,
            Cart,
            Complaint,
            Promotion
        } = this.models;
        try {
            const {
                order_id,
                comment
            } = req.body;
            const buyer_id = req["user_id"];
            if (await Complaint.findOne({
                order_id: Types.ObjectId(order_id),
                buyer_id: Types.ObjectId(buyer_id)
            })) {
                return res.status(409).send({ message: "Complaint existed" });
            }

            const newComplaint = new Complaint({
                order_id,
                comment,
                buyer_id
            });
            await newComplaint.save();
            return res.status(200).send({ "message": "Complaint created." });
        } catch (err) {
            return next(err);
        }
    }
    async report(req: Request, res: Response, next: NextFunction) {
        const {
            User,
            Product,
            Category,
            Variant,
            Order,
            RewardPts,
            Cart,
            Complaint,
            Promotion
        } = this.models;
        const commission = await
            Order.aggregate(
                // Limit to relevant documents and potentially take advantage of an index
                [{
                    $match: {
                        "commission_status": "Approved",
                        "merchant_id": req["user_id"]
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$total.commission" }
                    }
                }]
            );
        const order = await Order.aggregate(
            [{
                $match: {
                    "merchant_id": req["user_id"]
                }
            },
            {
                $group: {
                    _id: null,
                    qty: { $sum: 1 },
                    amt: { $sum: "$total.store_ap" }
                }
            }]);
        const paid = await Order.aggregate(
            [{
                $match: {
                    "status": "Paid",
                    "merchant_id": req["user_id"]
                }
            },
            {
                $group: {
                    _id: null,
                    qty: { $sum: 1 },
                    amt: { $sum: "$total.store_ap" }
                }
            }]);
        const result = {
            total: {
                order: {
                    all: order,
                    paid,
                    AD: await Order.count({ "merchant_id": req["user_id"], "status": "AD" }),
                    DG: await Order.count({ "merchant_id": req["user_id"], "status": "DG" }),
                    GR: await Order.count({ "merchant_id": req["user_id"], "status": "GR" }),
                },
                products: {
                    qty: await Product.count({ "merchant_id": req["user_id"] }),
                    "pending": await Product.count({ "merchant_id": req["user_id"], "status": "Pending" }),
                    "approved": await Product.count({ "merchant_id": req["user_id"], "status": "Approved" }),
                    "rejected": await Product.count({ "merchant_id": req["user_id"], "status": "Rejected" }),
                },
                commission: {
                    approved: commission
                },
            }
        };
        return res.status(200).send(result);
    }
    async pendingStock(req: Request, res: Response, next: NextFunction) {
        const products = await this.models.Product.update({ "brief.price": { $exists: false } }, { $set: { status: PRODUCT_STATUS.Rejected } }, { multi: true });

        return res.status(200).send("ok");
    }
    async deleteOrder(req: Request, res: Response, next: NextFunction) {
        const {
            User,
            Product,
            Category,
            Variant,
            Order,
            RewardPts,
            Cart,
            Complaint,
            Promotion
        } = this.models;
        try {
            const { order } = req.body;
            const order_id = [].concat(order).map(_id => Types.ObjectId(_id));
            const orderRemoved = await Order.remove({ "_id": { $in: order_id } });
            debug(`orderRemoved ${order_id}`);
            await RewardPts.remove({ "order_id": { $in: order_id } });
            await Complaint.remove({ "order_id": { $in: order_id } });

            return res.status(200).send({
                "message": "Order removed"
            });
        } catch (e) {
            debug(`error ${e}`);
            return next(e);
        }
    }
    async adminSearchOrder(req: Request, res: Response, next: NextFunction) {
        const orders = await this.models.Order.find(req.body.query).populate("buyer_id merchant_id", "contact profile", this.models.User);
        return res.status(200).send(orders);
    }
    async adminUpdateOrderStatus(req: Request, res: Response, next: NextFunction) {
        const {
            User,
            Product,
            Category,
            Variant,
            Order,
            RewardPts,
            Cart,
            Complaint,
            Promotion
        } = this.models;
        try {

            const { order_id } = req.query;
            const { status } = req.body;
            if (["AD", "DG", "GR"].indexOf(status) < 0) {
                return next(`Unkown status ${status}`);
            }
            const result = await Order.findByIdAndUpdate(order_id, { $set: { status } });
            if (!result) { res.status(200).send("No result found"); }
            return res.status(200).send(`Order status updated to ${status}`);
        } catch (e) {
            res.status(500);
            return next(e);
        }
    }
    buyerPostComment() {return commentCtrl("buyer").postComments; }
    async adminGetOrderComplain(req: Request, res: Response, next: NextFunction) {
        try {
            return res.status(200).send(await this.models.Complaint.find());
        }
        catch (err) {
            return next(err);
        }
    }

}
//         return {
//         getOrderDetail,
//         getPromotionDetailFromPromoCode,
//         processStore,
//         buyerConfirmOrder,
//         adminGetOrder: getOrder("admin"),
//         placeOrder,
//         pendingStock,
//         buyerMadePayment,
//         getPendingStock,
//         substractPendingStock,
//         buyerPostComplaint,
//         buyerGetOrder: getOrder("buyer"),
//         merchantGetOrder: getOrder("merchant"),
//         merchantProccedToNextStageOfOrder,
//         buyerPostComment: commentCtrl(config.role).postComments,
//         report,
//         adminSearchOrder,
//         adminUpdateOrderStatus,
//         adminGetOrderComplain,
//         deleteOrder
//     };
