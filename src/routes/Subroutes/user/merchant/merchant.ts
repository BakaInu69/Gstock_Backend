import { check, checkSchema, oneOf, param } from "express-validator/check";
import { Request, Response, NextFunction, Router } from "express";
import * as multer from "multer";
import * as mkdirp from "mkdirp";
import * as PDFkit from "pdfkit";
import { Types } from "mongoose";
import {
    ProductController,
    categoryController,
    attributeController,
    OrderController
} from "../../../../controllers";
import paths from "../../../../config/path";
import { FILESIZE, FILETYPES } from "../../../../_global/variables";
import { validationResponse } from "../../../../middleware/validationRes";
import * as _ from "lodash";
/**
 * Merchant app routes. /merchant
 */
export default (config) => {
    const orderCtrl = new OrderController(config);
    const storeBannerStorage = multer.diskStorage({
        destination(req, file, cb) {
            mkdirp("./dist/uploads/user/" + (<any>req).locals.user.id,
                () => cb(undefined, "./dist/uploads/user/" + (<any>req).locals.user.id)
            );
        },
        filename(req, file, cb) {
            try {
                console.log("Saving image");
                cb(undefined, "/store_banner.png");
            } catch (err) {
                cb(err, "");
            }
        }
    });
    const storeBannerUpload = multer({
        storage: storeBannerStorage
    });
    const productPicStorage = multer.diskStorage({
        destination(req: Request, file, cb) {
            const fileUrl = `${paths.userUploadDir}/${req["user_id"]}/products/${req.params["productId"]}/`;
            mkdirp(paths.appDir + fileUrl, () => cb(undefined, paths.appDir + fileUrl));
        },
        filename(req: Request, file, cb) {
            try {
                const files = req.files instanceof Array ? req.files : req.files[file.fieldname];
                cb(undefined, file.originalname);
            } catch (err) {
                cb(err, "/" + req.params.productId + "-" + file.originalname + ".png");
            }
        }
    });
    const productDescriptionPicStorage = multer.diskStorage({
        destination(req: Request, file, cb) {
            req["product_id"] = req.query["product_id"];
            const fileUrl = `${paths.userUploadDir}/${req["user_id"]}/products/${req["product_id"]}/description/`;
            mkdirp(paths.appDir + fileUrl,
                () => cb(undefined, paths.appDir + fileUrl)
            );
        },
        filename(req: Request, file, cb) {
            try {
                // const files = req.files instanceof Array ? req.files : req.files[file.fieldname];
                req["originalName"] = file.originalname;
                cb(undefined, file.originalname);
            } catch (err) {
                cb(err, "/" + req.params.productId + "-" + file.originalname + ".png");
            }
        }
    });
    const productPicUpload = multer({
        storage: productPicStorage,
        fileFilter(req, file, cb) {
            const filetypes = FILETYPES.image;
            const mimetype = filetypes.test(file.mimetype);
            if (mimetype) return cb(null, true);
            cb(new Error("Error: File upload only supports the following filetypes - " + filetypes), false);
        },
        limits: { fileSize: FILESIZE.image }
    });
    const productDescriptionPicUpload = multer({
        storage: productDescriptionPicStorage, limits: { fileSize: FILESIZE.image }
    });
    const {
        getAllCategory,
        getVariantOptions
    } = categoryController(config);
    const attributeCtrl = attributeController(config);
    const productCtrl = new ProductController(config);
    const {
        isProductActiveOrInPendingOrder,
        getProducts,
        merchantCreateProduct,
        merchantUpdateProduct,
        merchantUpdateProductActive,
        merchantDeleteProduct,
        merchantGetVariant,
        merchantCreateVariant,
        merchantDeleteVariant,
        merchantUpdateVariant,
        merchantRemoveProductImage,
        merchantUploadProductImage,
        merchantUploadProductImageLimit,
        merchantUploadProductDescriptionImage,
        // merchantGetImageUrl
    } = _.bindAll(productCtrl, Object.getOwnPropertyNames(ProductController.prototype));
    const {
        report,
        getOrder,
        merchantProccedToNextStageOfOrder
    } = _.bindAll(orderCtrl, Object.getOwnPropertyNames(OrderController.prototype));


    return Router()
        .get("/product",  getProducts("merchant"))
        .post("/product",
            [
                check("category", "Product category must be defined").exists()
            ], [validationResponse, merchantCreateProduct])
        .put("/product",
            checkSchema({
                "brief.short_description": {
                    in: ["body"],
                    isLength: {
                        options: { max: 150 },
                        errorMessage: "Product short description must not exceed 150 characters.",
                    }
                },
                "stock.qty": {
                    in: ["body"],
                    isInt: {
                        options: { min: 1 },
                        errorMessage: "Product quantity must at least be 1.",
                    }
                },
                "brief.name": {
                    in: ["body"],
                    isLength: {
                        options: { max: 50 },
                        errorMessage: "Product name must not exceed 50 characters.",
                    }
                },
                "detail.brand": {
                    in: ["body"],
                    isLength: {
                        options: { max: 50 },
                        errorMessage: "Product brand name must not exceed 50 characters.",
                    }
                }
            }), [validationResponse, merchantUpdateProduct])
        .post("/product/bulk/delete", [isProductActiveOrInPendingOrder, merchantDeleteProduct])
        .put("/product/active", merchantUpdateProductActive)
        .get("/product/category", getAllCategory)
        // .get("/variant", oneOf([
        //     check("product_id").exists(),
        //     check("variant_id").exists()],
        //     "You need to provide either product_id or variant_id, if both product_id take precedence"
        // ), productCtrl.merchantGetAllVariant)
        .get("/variant", merchantGetVariant)
        .post("/variant", checkSchema({
            "variants.*.price": {
                in: ["body"],
                isFloat: {
                    options: { min: 0.1 },
                    errorMessage: "Product price must not be lower than 0.1.",
                }
            },
            "variants.*.stock": {
                in: ["body"],
                isInt: {
                    options: { min: 1 },
                    errorMessage: "Product quantity must at least be 1.",
                }
            }
        }), [validationResponse, merchantCreateVariant])
        .post("/variant/delete", merchantDeleteVariant)
        .put("/variant", checkSchema({
            "price": {
                in: ["body"],
                isFloat: {
                    options: { min: 0.1 },
                    errorMessage: "Product price must not be lower than 0.1.",
                }
            },
            "stock": {
                in: ["body"],
                isInt: {
                    options: { min: 1 },
                    errorMessage: "Product quantity must at least be 1.",
                }
            }
        }), [validationResponse, merchantUpdateVariant])
        // .get("/variant/options/:productId", productCtrl.merchantGetAllVariantOptions)
        .post("/thumbnail/slider/:productId", [merchantUploadProductImageLimit, productPicUpload.array("productPic"), merchantUploadProductImage])
        .post("/thumbnail/description", productDescriptionPicUpload.array("productPic"), merchantUploadProductDescriptionImage)
        .post("/thumbnail/delete/:productId", checkSchema({
            productId: {
                in: "params",
                errorMessage: "Product id is required"
            },
            remove: {
                in: "body",
                isString: {
                    errorMessage: "Invalid file name"
                },
                errorMessage: "Files to remove is required"
            }
        }), merchantRemoveProductImage)
        // .get("/thumbnail/:productId", merchantGetImageUrl)
        .get("/variant_options", getVariantOptions)
        .post("/thumbnail/variant/:variantId")
        .get("/order", getOrder("merchant"))
        .get("/express", attributeCtrl.merchantGetExpressProvider)
        .post("/order/confirm", merchantProccedToNextStageOfOrder)
        .post("/order/cancel")
        .get("/order/invoice", async (req: Request, res: Response, next: NextFunction) => {
            const doc = new PDFkit;
            doc.on("pageAdded", () => {
                doc.circle(280, 200, 50).fill("#6600FF");
            });
            try {
                doc.pipe(res);
                doc.text("My man!!!!");
                doc.addPage();
                doc.end();
                return;
            } catch (e) {
                return res.status(400).send(e);
            }
        })
        .get("/report", report)
        .post("/account/store/banner", storeBannerUpload.array("storeBanner"), async (req, res, next) => {
            return res.status(200).send("Upload succesfull");
        });
};





// export let getOrder = (req: Request, res: Response, next: NextFunction) => { };
// export let postOrder = (req: Request, res: Response, next: NextFunction) => { };