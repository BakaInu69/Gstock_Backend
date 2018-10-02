import * as del from "del";
import { NextFunction, Request, Response } from "express";
import * as mkdirp from "mkdirp";
import { Types } from "mongoose";
import * as multer from "multer";
import * as fs from "fs-extra";
import paths from "./../config/path";
import commentController from "./comment";
import { isArrayUnique } from "./../../src/_lib/array";
import { PRODUCT_STATUS } from "../../src/_status/status";
import { ObjectID } from "bson";
import { flatten } from "../_lib/flatObjOnly";
import { isVariantPriceInRange } from "../_global/business";
import { Config } from "../types/app";
import { Passport } from "passport";
import { ProductModel } from "../models/Schemas/Product";

/**
 * Product app controller.
 */
export class ProductController {
    public models;
    public userPassport: Passport;
    // config;
    constructor(private config) {
        // this.config = config;
        this.models = config.models;
        this.userPassport = config.passport.userPassport.getUserPassport();
    }
    public async queryFactory(q) {
        const {
            limit = 3,
            page = 1,
            select = "brief",
            name = "",
            low,
            high,
            category,
            status,
            store_name,
            intervals,
            sortby = "-date",
            product_id,
            brand,
            related = false
        } = q;
        const query: any = {
            /**
             * Default query
             */
            "brief.stock": { $gte: 1 },
            "brief.name": { $regex: name, $options: "i" },
            "pricing.discount_price": { "$nin": [null] },
        };
        if (low && !isNaN(low)) {
            query["pricing.discount_price"]["$gte"] = Number(low);
        }
        if (high && !isNaN(high)) {
            query["pricing.discount_price"]["$lte"] = Number(high);
        }
        // Find merchant based on store_name maybe large results in memory
        if (store_name) {
            const merchantID = await this.models.User.find({ "store.name": { $regex: store_name, $options: "i" } }, { select: "_id" }).lean() as Array<{ _id: string }>;
            query["merchant_id"] = { $in: merchantID.map(e => Types.ObjectId(e._id)) };
        }
        if (brand) {
            query["detail.product_brand"] = brand;
        }
        if (category) {
            const sub = category.split("*");
            query["brief.category"] = sub.length > 1 ? { $regex: new RegExp(`^${sub[0]}.+${sub[1]}`), $options: "i" } : { $regex: category, $options: "i" };
        }
        if (intervals) {
            const intervalsArray = intervals.split("/");
            // if (2 !== intervalsArray.length) return res.status(400).send({ message: "Invalid intervals format. Please ensure xxxx-xxxx." });
            const start = new Date(intervalsArray[0]);
            const end = new Date(intervalsArray[1]);
            query["updatedAt"] = { $gte: start, $lte: end };
        }

        let sort = "-" === sortby[0] ? "-" : "";
        query["status"] = status ? status : { $in: Object.keys(PRODUCT_STATUS).map(k => PRODUCT_STATUS[k]) };
        switch ("-" === sort ? sortby.slice(1) : sortby) {
            case "pricing":
                sort += "pricing.discount_price";
                break;
            case "date":
                sort += "updatedAt";
                break;
            default: sort += "pricing.discount_price";
        }
        // switch (role) {
        //     case "merchant": {
        //         // query["merchant_id"] = Types.ObjectId(req.locals.user.id);
        //         break;
        //     }
        //     case "buyer": {
        //         /**
        //          * Buyer will find all stock that is approved
        //          */
        //         query["is_active"] = true;
        //         query["status"] = { $in: [PRODUCT_STATUS.Approved] };
        //         break;
        //     }
        //     case "approved": {
        //         query["status"] = { $in: [PRODUCT_STATUS.Approved] };
        //         break;
        //     }
        //     case "admin": {
        //         query["status"] = undefined !== status ? status : { $in: Object.keys(PRODUCT_STATUS).map(k => PRODUCT_STATUS[k]) };
        //         query["brief.stock"] = { $exists: true };
        //         query["pricing.discount_price"]["$nin"] = [];
        //         break;
        //     }
        //     default: break;
        // }
    }
    public async getRelevantProduct(query) {
        if (query["brief.category"]) {
            delete query["brief.name"];
        }
        const r = await this.models.Product.aggregate([
            {
                $match: query
            },
            {
                "$group": {
                    "_id": {
                        "category": "$brief.category"
                    },
                    count: { $sum: 1 }
                }
            }
        ]).exec();
        return r;
    }
    public getProducts(role) {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                const {
                    limit = 3,
                    page = 1,
                    select = "brief",
                    name = "",
                    low,
                    high,
                    category,
                    status,
                    store_name,
                    intervals,
                    sortby = "-date",
                    product_id,
                    brand,
                    related = false
                } = req.query;
                if (product_id) {
                    return res.status(200).send(await this.models.Product.findById(product_id));
                }
                const query: any = {
                    /**
                     * Default query
                     */
                    "brief.stock": { $gte: 1 },
                    "brief.name": { $regex: name, $options: "i" },
                    "pricing.discount_price": { "$nin": [null] },
                };
                // {
                //     "brief.attributes.value": { $regex: name, $options: "i" }
                // }
                if (low && !isNaN(low)) {
                    query["pricing.discount_price"]["$gte"] = Number(low);
                }
                if (high && !isNaN(high)) {
                    query["pricing.discount_price"]["$lte"] = Number(high);
                }
                // Find merchant based on store_name
                if (store_name) {
                    const merchantID = await this.models.User.find({ "store.name": { $regex: store_name, $options: "i" } }, { select: "_id" }).lean() as Array<{ _id: string }>;
                    query["merchant_id"] = { $in: merchantID.map(e => Types.ObjectId(e._id)) };
                }
                if (brand) {
                    query["detail.product_brand"] = brand;
                }
                if (category) {
                    const sub = category.split("*");
                    if (sub.length > 1) {
                        const category = new RegExp(`^${sub[0]}.+${sub[1]}`);
                        query["brief.category"] = { $regex: category, $options: "i" };
                    } else {
                        query["brief.category"] = { $regex: category, $options: "i" };
                    }
                }
                if (intervals) {
                    const intervalsArray = intervals.split("/");
                    if (2 !== intervalsArray.length) return res.status(400).send({ message: "Invalid intervals format. Please ensure xxxx-xxxx." });
                    const start = new Date(intervalsArray[0]);
                    const end = new Date(intervalsArray[1]);
                    console.log(start, end);
                    query["updatedAt"] = { $gte: start, $lte: end };
                }

                let sort = "-" === sortby[0] ? "-" : "";
                query["status"] = status ? status : { $in: Object.keys(PRODUCT_STATUS).map(k => PRODUCT_STATUS[k]) };
                switch ("-" === sort ? sortby.slice(1) : sortby) {
                    case "pricing":
                        sort += "pricing.discount_price";
                        break;
                    case "date":
                        sort += "updatedAt";
                        break;
                    default: sort += "pricing.discount_price";
                }
                switch (role) {
                    case "merchant": {
                        query["merchant_id"] = Types.ObjectId(res.locals.user._id);
                        break;
                    }
                    case "buyer": {
                        /**
                         * Buyer will find all stock that is approved
                         */
                        query["is_active"] = true;
                        query["status"] = { $in: [PRODUCT_STATUS.Approved] };
                        break;
                    }
                    case "approved": {
                        query["status"] = { $in: [PRODUCT_STATUS.Approved] };
                        break;
                    }
                    case "admin": {
                        query["status"] = undefined !== status ? status : { $in: Object.keys(PRODUCT_STATUS).map(k => PRODUCT_STATUS[k]) };
                        query["brief.stock"] = { $exists: true };
                        query["pricing.discount_price"]["$nin"] = [];
                        break;
                    }
                    default: break;
                }
                const options = {
                    populate: [
                        {
                            path: "merchant_id",
                            select: "email store createdAt",
                            model: this.models.User
                        },
                        { path: "category_id", model: this.models.Category },
                    ],
                    lean: true,
                    page: Number(page),
                    limit: Number(limit),
                    sort,
                    select: select.split("/").join(" ") + " merchant_id createdAt"
                };
                const result = await this.models.Product.aggregate([
                    {
                        "$match": query
                    },
                    {
                        "$group": {
                            "_id": null,
                            "max_price": { "$max": "$pricing.discount_price" },
                            "min_price": { "$min": "$pricing.discount_price" }
                        }
                    }
                ]).exec();
                const products = await this.models.Product.paginate(query, options);
                return res.status(200).send({
                    ...products,
                    related: related ? await this.getRelevantProduct(query) : [],
                    ...result[0]
                });
            } catch (error) {
                return next(error);
            }
        };
    }
    public async isProductActiveOrInPendingOrder(req: Request, res: Response, next: NextFunction) {
        const { product } = req.body;
        try {
            const product_id = product.map(id => Types.ObjectId(id));
            const inOrder = await this.models.Order.findOne({
                "products.product._id": { $in: product_id },
                "status": { $ne: "GR" }
            }).lean();
            if (inOrder) { return res.status(400).send({ "message": "This product has pending order" }); }
            const isActive = await this.models.Product.findOne(
                {
                    "_id": { $in: product_id },
                    is_active: true
                }).lean() as ProductModel;
            if (isActive) { return res.status(400).send({ "message": "This product is still active" }); }

            next();
        } catch (error) {
            return next(error);
        }
    }

    public adminGetProducts() {
        return this.getProducts("admin");
    }
    public async adminUpdateProductStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { product_id, status } = req.body;
            const productIds = [].concat(product_id).map(id => Types.ObjectId(id));
            const contentToUpdate = {
                status: "Approved" === status ? PRODUCT_STATUS.Approved : PRODUCT_STATUS.Rejected,
            };
            const product = await this.models.Product.update({ _id: { $in: productIds } }, { $set: { ...contentToUpdate, is_active: "Approved" === status } }, { multi: true });
            await this.models.Variant.update({ product_id: { $in: productIds } }, { $set: contentToUpdate }, { multi: true });
            return res.status(200).json({ message: `Product ${"Approved" === status ? "approved" : "rejected"}!` });
        } catch (e) {
            res.status(400);
            return next(e);
        }
    }
    public async adminUpdateProducts(req: Request, res: Response, next: NextFunction) {
        const { product_id: productId } = req.query;
        const blacklist = ["status", "merchant_id", "is_active"];
        if (!isArrayUnique(blacklist.concat(Object.keys(req.body)))) return res.status(200).send({ message: "Invalid Update" });
        const update = flatten(req.body, ".", "attributes");
        if (update["stock.qty"] < 1) { return res.status(400).send({ message: "Stock must be more than 0" }); }
        if (update["stock.qty"]) update["brief.stock"] = update["stock.qty"];
        try {
            const product = await this.models.Product.findByIdAndUpdate({
                "_id": productId,
            }, { $set: update }).lean();
            return res.status(200).json({ "message": "Product updated!" });
        } catch (err) {
            res.status(400);
            return next(err);
        }
    }
    public async adminDeleteSingleProduct(req: Request, res: Response, next: NextFunction) {
        const { product_id } = req.query;
        try {
            const product = await this.models.Product.findByIdAndRemove(product_id);
            await this.models.Variant.remove({ product_id: Types.ObjectId(product_id) });
            fs.removeSync(
                `${paths.appDir}/${paths.userUploadDir}/${product.merchant_id}/products/${product_id}/`
            );
            return res.status(200).send({ message: "Product deletion successful" });
        } catch (error) {
            return next(error);
        }
    }
    public async adminFindOrphangeProducts(req: Request, res: Response, next: NextFunction) {
        await this.models.Product.find().select("_id");
    }

    public async merchantCreateProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const {
                category,
                category_id,
                attributes
            } = req.body;
            const product = await new this.models.Product({
                merchant_id: Types.ObjectId(res.locals.user.id),
                category_id: Types.ObjectId(category_id),
                "brief.category": category,
                "brief.attributes": attributes
            }).save();
            return res.status(201).send({ "product_id": product.id });
        } catch (e) {
            return next(e);
        }
    }
    public async  merchantUpdateProduct(req: Request, res: Response, next: NextFunction) {
        const merchantId = res.locals.user.id;
        const update = flatten(req.body, ".", "attributes");
        const {
            product_id,
            "stock.qty": stockQty,
            "brief.short_description": shortDescription,
            "brief.product_name": productName,
            "brief.discount": discount,
            "brief.price": productPrice,
            "detail.product_brand": productBrandName,
            "pricing.discount_rate": discountRate,
        } = update;
        if (stockQty) {
            update["brief.stock"] = update["stock.qty"]; // To be backward compatitble with old product imported.
        }

        // check if pricing is valid
        if (!discount) {
            update["pricing.discount_rate"] = 0;
        }
        if (discountRate < 0 || discountRate >= 100) {
            return res.status(400).send({ message: "Disocunt rate must be within 1-99 range" });
        }

        update["pricing.discount_price"] = productPrice * (1 - (discountRate || 0) / 100);
        try {
            const product = await this.models.Product.findOneAndUpdate(
                {
                    "_id": Types.ObjectId(product_id),
                    "merchant_id": Types.ObjectId(merchantId)
                },
                { $set: update });
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }
            // Check if product base price is changed,

            if (productPrice && productPrice !== product.brief.price) {
                // if yes set all variant to base price to product base price
                console.log("Updating all variant base price");
                await this.models.Variant.update(
                    { product_id: Types.ObjectId(product_id) },
                    { $set: { price: productPrice } },
                    { multi: true }
                );
            }
            return res.status(200).send({ message: "Product updated!" });
        } catch (err) {
            res.status(400);
            return next(err);
        }
    }
    public async merchantUpdateProductActive(req: Request, res: Response, next: NextFunction) {
        const { product_id } = req.query;
        const merchant_id = req["user_id"];
        if (!res.locals.user.is_active) {
            return res.status(400).send({ message: "Inactivated merchant has no authorization to perform this action" });
        }

        const product = await this.models.Product.findOne({ "_id": Types.ObjectId(product_id), "merchant_id": Types.ObjectId(merchant_id) });
        if (!product.is_active) {
            if (product.stock.qty < 1) { return res.status(400).send({ message: "Insufficient quantity" }); }
        }
        product.is_active = !product.is_active;
        await product.save();
        return res.status(200).send({ message: "Product status changed" });
    }
    public async merchantDeleteProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const { product } = req.body;
            const product_id = product.map(id => Types.ObjectId(id));
            await this.models.Product.remove({
                "merchant_id": Types.ObjectId(req["user_id"]),
                "_id": { $in: product_id }
            }).lean();
            await this.models.Variant.remove({ product_id: { $in: product_id } });
            product.forEach(
                (product_id) => {
                    fs.removeSync(
                        `${paths.appDir}/${paths.userUploadDir}/${req["user_id"]}/products/${product_id}/`
                    );
                }
            );
            return res.status(201).send({ message: "Product deleted" });
        } catch (e) {
            return next(e);
        }
    }

    public async putStoreName(req: Request, res: Response, next: NextFunction) {
    }
    // merchantGetImageUrl: async (req: Request, res: Response, next: NextFunction) => {
    //     try {
    //         fs.readdir(paths.appDir + paths.userUploadDir + "/" + req["user_id"] + "/products/" + req.params["productId"] + "/", (error, paths) => { return res.status(200).json(paths); });
    //     } catch (err) {
    //         res.status(400);
    //         return next(err);
    //     }
    // },
    public async  merchantUploadProductImageLimit(req: Request, res: Response, next: NextFunction) {
        const { productId } = req.params;
        try {
            if (productId === undefined) return res.status(400).send({ message: "Invalid product ID" });
            // this upload function is trigger once per image.
            const theProduct = await this.models.Product.findById(productId);
            if (!theProduct) return res.status(409).send({ message: "product not found" });
            if ((theProduct.brief.images.length + 1) >= 12) return res.status(400).json({ message: "Maximum upload number is 12." });
            return next();
        } catch (err) {
            next(err);
        }
    }
    public async  merchantUploadProductImage(req: Request, res: Response, next: NextFunction) {
        const { productId } = req.params;
        await this.models.Product.findByIdAndUpdate(productId, { $addToSet: { "brief.images": req.files[0].originalname } });
        return res.status(200).json({ message: "Image uploaded" });
    }
    public async  merchantUploadProductDescriptionImage(req: Request, res: Response, next: NextFunction) {
        return res.status(200).json({ "link": `https://gstock.sg/buyer.gstock/uploads/user/${req["user_id"]}/products/${req["product_id"]}/description/${req["originalName"]}` });
    }
    public async  merchantRemoveProductImage(req: Request, res: Response, next: NextFunction) {
        try {
            const { remove } = req.body;
            const { productId } = req.params;
            const d = [].concat(remove).map(e => `${paths.appDir + paths.userUploadDir}/${(<any>req).locals.user.id}/products/${productId}/${e}`);
            await this.models.Product.findByIdAndUpdate(
                productId,
                { $pull: { "brief.images": { $in: [].concat(remove) } } });
            const filesRemovedFromDisk = await del(d);
            return res.status(200).json({ message: filesRemovedFromDisk.length + " files removed from disk" });
        } catch (err) {
            return next(err);
        }
    }

    public async  merchantCreateVariant(req: Request, res: Response, next: NextFunction) {
        try {
            const {
                variants: variantsSubmitted,
                product_id
            } = req.body;
            const user_id = req["user_id"];
            // check price
            if (!variantsSubmitted.length) {
                return res.status(200).send({ message: "0 variant added" });
            }
            const product = await this.models.Product.findById(product_id);
            if (!product) {
                return res.status(404).send({ "message": "Product not found" });
            }

            const outOfRangeVariant = variantsSubmitted.filter(v => !isVariantPriceInRange(product.brief.price, v.price));
            if (outOfRangeVariant.length) {
                return res.status(400).send({ "message": "Variant price out of range. Must be -50% to 100% of base price." });
            }
            const variantsFound = await this.models.Variant.find({
                "product_id": Types.ObjectId(product_id),
                "merchant_id": Types.ObjectId(user_id)
            });
            if (variantsFound) {
                const optionValuesNew = variantsFound.concat(variantsSubmitted).map(item => item["option_value"]);
                if (!isArrayUnique(optionValuesNew)) {
                    return res.status(409).send({ "message": "Variant name and value conflicts. Please ensure you provide unique variant name for a single product" });
                }
            }
            const result = await this.models.Variant.insertMany(
                variantsSubmitted.map(e => ({
                    ...e,
                    product_id,
                    merchant_id: user_id
                })
                ));
            return res.status(200).send({ message: `${variantsSubmitted.length} variant added`, data: result });
        } catch (err) {
            res.status(400);
            return next(err);
        }
    }
    public async  merchantGetVariant(req: Request, res: Response, next: NextFunction) {
        try {
            const { product_id } = req.query;
            const user_id = req["user_id"];
            const result = await this.models.Variant.find({
                "product_id": Types.ObjectId(product_id),
                "merchant_id": Types.ObjectId(user_id)
            });
            return res.status(200).send(result);
            // return res.status(200).send({ message: `${variantsSubmitted.length} variant added` });
        } catch (err) {
            res.status(400);
            return next(err);
        }
    }
    public async merchantUpdateVariant(req: Request, res: Response, next: NextFunction) {
        try {
            const { variant_id } = req.body;
            // check quantity
            console.log(req.body);
            const user_id = req["user_id"];
            const variant = await this.models.Variant.findOne({
                _id: variant_id,
                merchant_id: user_id
            });
            const product = await this.models.Product.findById(variant.product_id);
            // check price
            if (req.body.price && !isVariantPriceInRange(product.brief.price, req.body.price)) { return res.status(400).send({ message: "Variant price should be between -50% and +100% of product listing price." }); }
            await this.models.Variant.findOneAndUpdate(
                {
                    _id: variant_id,
                    merchant_id: user_id
                }, { $set: req.body });
            if (!variant) { return res.status(400).json({ message: "No variant of such product is found. Please go to product page to add its variants" }); }
            return res.status(200).json({ message: "Variant updated!" });
        } catch (err) {
            res.status(400);
            return next(err);
        }
    }
    public async merchantDeleteVariant(req: Request, res: Response, next: NextFunction) {
        const { variant_id } = req.body;
        console.log(variant_id);
        try {
            const result = await this.models.Variant.findByIdAndRemove(variant_id);
            if (!result) { return res.status(404).send({ message: "No such variant found!" }); }
            return res.status(200).send({ message: "Variant removed" });
        } catch (error) {
            return next(error);
        }
    }

    // public getBuyerProducts() {
    //     // console.log("ok");
    //     return this.getProducts("buyer");
    // }
    public getApprovedProducts() {
        return this.getProducts("buyer");
    }
    public async  getProductsVariants(req: Request, res: Response, next: NextFunction) {

        try {
            const { product_id } = req.query;
            // "status": PRODUCT_STATUS.Approved
            if (!ObjectID.isValid(product_id)) return res.status(400).send({ message: "Invalid product id" });
            // if (!result.length) { return res.status(200).send([]); }
            // const pendingStockOfVaraints = await getPendingStock(models, product_id, true);
            // pendingStockOfVaraints.forEach(p => {
            //     const r = result.find(r => JSON.stringify(r.id) === JSON.stringify(p._id.variant_id));
            //     console.log(r);
            //     r.stock -= p.total;
            // });
            return res.status(200).send(await this.models.Variant.find({ product_id: new ObjectID(product_id) }));
        } catch (error) {
            return next(error);
        }
    }

    public getSingleProductDetail(requester) {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { product_id } = req.query;
                if (!ObjectID.isValid(product_id)) return res.status(400).send({ message: "Invalid product id" });
                const comments = await commentController(this.config).getComments(product_id);
                const query = {
                    _id: Types.ObjectId(product_id),
                };
                switch (requester) {
                    case "buyer": {
                        query["status"] = PRODUCT_STATUS.Approved;
                        query["is_active"] = true;
                    }
                        break;
                }
                const p = await this.models.Product.findOne(query).populate({ path: "category_id", populate: { path: "attributes" } }).lean() as ProductModel;
                if (!p) { return res.status(404).send(p); }
                await this.models.User.populate(p, { path: "merchant_id", select: "credential.email commission store profile" });
                console.log(`The product base price is ${p.brief.price}, discounted price is ${p.pricing.discount_price} and commission rate is ${p.category_id["commission"]}`);
                p["reward_pts"] = (p.brief.price * p.category_id["commission"] / 100 * 5).toFixed(2);
                console.log("comments", comments);
                p["comments"] = comments;
                const variants: any = await this.models.Variant.find({
                    "product_id": Types.ObjectId(product_id),
                    // "status": PRODUCT_STATUS.Approved
                }).lean();
                variants.forEach(v => v["reward_pts"] = (v.price * p.category_id["commission"] / 100 * 5).toFixed(2));
                return res.status(200).send(
                    {
                        product: p,
                        variants,
                    }
                );
                // const r = await getPendingStock(models, product_id, false);
                // if (r.length) pendingStock = r[0].total;
            } catch (err) {
                return next(err);
            }
        };
    }
    public async  getRelevantProductFromStore(req: Request, res: Response, next: NextFunction) {
        try {
            const { product_id, self = 0 } = req.query;
            if (!ObjectID.isValid(product_id)) return res.status(400).send({ message: "Invalid product id" });
            const {
                brief,
                merchant_id
            } = await this.models.Product.findById(product_id);
            const category = brief.category.split(",")[1];
            const query = {
                "brief.stock": { $gte: 0 },
                _id: { $ne: new ObjectID(product_id) },
                "brief.category": { $regex: category },
                status: PRODUCT_STATUS.Approved,
                is_active: true,
                merchant_id: !parseInt(self) ? { "$ne": merchant_id } : merchant_id
            };
            return res.status(200).send(await this.models.Product.find(query).limit(4).sort("-createdAt"));
        } catch (error) {
            return next(error);
        }
    }
}