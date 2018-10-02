import { NextFunction, Request, Response } from "express";
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as multer from "multer";
import { Types } from "mongoose";
import paths from "./../config/path";
import { FILETYPES, FILESIZE } from "../_global/variables";
/**
 * Product app routes.
 */
// console.log("10101010");
export default (config) => {
    const { models } = config;
    const homeImageStorage = multer.diskStorage({
        destination(req: Request, file, cb) {
            const pathToSave = `${paths.appDir}/uploads/home/${file.fieldname.split("Img")[0]}/`;
            fs.ensureDirSync(pathToSave);
            cb(undefined, pathToSave);
        },
        filename(req: Request, file, cb) {
            try {
                const files = req.files instanceof Array ? req.files : req.files[file.fieldname];
                cb(undefined, `/${(req.body.whichImage || 1) + ".png"}`);
            } catch (err) {
                cb(err, `${req.body.whichImage + ".png"}`);
            }
        }
    });
    function getAttributeOptions(queryOverwrite) {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                const options = await models.Attribute.find({
                    ...req.query,
                    ...queryOverwrite
                });
                return res.status(200).send(options);
            } catch (err) {
                return next(err);
            }
        };
    }
    function addAttributeOptions(queryOverwrite) {
        return async (req: Request, res: Response, next: NextFunction) => {
            console.log(req.body);
            try {
                if (req.body["value"] === undefined) { return next("Option value must be specified"); }
                const duplicated = await models.Attribute.findOne(req.body);
                if (duplicated) { return res.status(400).send({ message: "Attribute's option value duplicated" }); }
                const { title, name, value } = req.body;

                await models.Attribute.findOneAndUpdate(
                    {
                        name,
                        ...queryOverwrite,
                    },
                    { $addToSet: { value } },
                    { upsert: true });
                return res.status(200).send({ message: "Attribute's options added" });
            } catch (err) {
                return next(err);
            }
        };
    }
    function updateAttributeOptions(queryOverwrite?) {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                console.log("Receiving", req.body, req.query);
                if (!_.isEqual(Object.keys(req.body), Object.keys(req.query))) {
                    throw ("Update does not match");
                }
                const conflict = await models.Attribute.findOne(req.body);
                if (conflict) { return next("Conflict value"); }
                if (req.query["value"] !== undefined) {
                    const attr = await models.Attribute.findOneAndUpdate(req.query, { $set: { "value.$": req.body["value"] } });
                    if (!attr) { return next("No match found"); }
                    return res.status(200).send({ message: "Updated" });
                }
                req.query = {
                    ...req.query,
                    ...queryOverwrite
                };
                const attr = await models.Attribute.update(req.query, req.body, { multi: true, upsert: true });
                if (!attr) { return next("No match found"); }
                return res.status(200).send({ message: "Updated" });
            } catch (error) {
                return next(error);
            }
        };
    }
    async function merchantGetExpressProvider(req: Request, res: Response, next: NextFunction) {
        try {
            const { provider } = req.query;
            const match = new RegExp("^" + provider + ",");
            const providers = await models.Attribute.findOne({ "title": "express" });
            const found = providers.value.find(e => {
                if (e.match(match)) {
                    return true;
                }
            });

            return res.status(200).send({
                field: providers.name,
                value: found
            });
        } catch (error) {

        }
    }
    async function deleteAttributeOptions(req: Request, res: Response, next: NextFunction) {
        try {
            console.log(req.query, req.body);
            const options = await models.Attribute.update(
                {
                    "title": req.query["title"],
                    "name": req.query["name"],
                },
                {
                    $pull: {
                        "value": { $in: [].concat(req.body["value"]) }
                    }
                }
            );
            return res.status(200).send(options);
        } catch (err) {
            return next(err);
        }
    }
    async function updateUIFloorsOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const attr = await models.Attribute.findOneAndUpdate({ "title": "common-ui", "name": "floor_order" }, { $set: { "value": req.body["order"] } });
            return res.status(200).send({ message: "Updated" });
        } catch (error) {
            return next(error);
        }
    }
    async function updateBrands(req: Request, res: Response, next: NextFunction) {
        try {
            const brands = await models.Attribute.findOneAndUpdate({ "title": "home_page", "name": "brands" }, { $set: { "value": req.body["brands"] } });
            return res.status(200).send({ message: "Updated" });
        } catch (error) {
            return next(error);
        }
    }
    async function getBrands(req: Request, res: Response, next: NextFunction) {
        try {
            return res.status(200).send(await models.Attribute.findOne({ "title": "home_page", "name": "brands" }));
        } catch (error) {
            return next(error);
        }
    }
    async function updateAdsLink(req: Request, res: Response, next: NextFunction) {
        try {
            const adsLink = await models.Attribute.findOneAndUpdate({ "title": "home_page", "name": "ads_link" }, { $set: { "value": req.body["ads_link"] } });
            return res.status(200).send({ message: "Updated" });
        } catch (error) {
            return next(error);
        }
    }
    async function getAdsLink(req: Request, res: Response, next: NextFunction) {
        try {
            return res.status(200).send(await models.Attribute.findOne({ "title": "home_page", "name": "ads_link" }));
        } catch (error) {
            return next(error);
        }
    }
    return {
        merchantGetExpressProvider,
        getAttributeOptions,
        addAttributeOptions,
        updateAttributeOptions,
        deleteAttributeOptions,
        updateUIFloorsOrder,
        updateBrands,
        getBrands,
        updateAdsLink,
        getAdsLink,
        homeImageUpload: multer({
            storage: homeImageStorage,
            limits: { fileSize: FILESIZE.image },
            fileFilter(req, file, cb) {
                const filetypes = FILETYPES.image;
                const mimetype = filetypes.test(file.mimetype);
                if (mimetype) return cb(null, true);
                cb(new Error("Error: File upload only supports the following filetypes - " + filetypes), false);
            }
        }),
        getExpress: getAttributeOptions({ "title": "express" }),
        addExpress: addAttributeOptions({ "title": "express" }),
        addUIFloor: addAttributeOptions({ "title": "common-ui" }),
        getUIFloors: getAttributeOptions({ "title": "common-ui" }),
        updateUIFloors: updateAttributeOptions({ "title": "common-ui" }),
        getVariantOptions: getAttributeOptions({ "title": "variant_options" }),
        addVariantOptions: addAttributeOptions({ "title": "variant_options" }),
        addHomePageUIOptions: addAttributeOptions({ "title": "home_page" }),
        getHomePageUIOptions: getAttributeOptions({ "title": "home_page" }),
        createHomePageAds: updateAttributeOptions({ "title": "home_page", "name": "ads" }),

    };
};

