import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";


/**
 * Category controller.
 */


export default (config) => {
    const { models } = config;
    async function postCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const { name } = req.body;
            const categoryName = RegExp("^" + name);
            if (!name) { return res.status(400).json("Cateogry name must not be empty"); }
            const existingCategory = await models.Category.findOne({ "path": { $regex: categoryName } });
            if (existingCategory) { return res.status(409).json("Category existed!"); }
            await new models.Category({ "path": name }).save();
            return res.status(201).json({ message: "Category created!" });
        } catch (error) {
            res.status(500);
            return next(error);
        }
    }
    async function deleteCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const regex = new RegExp(`^${req.body.path}`);
            console.log(req.body.path);
            await models.Category.remove({ "path": { $regex: regex } });
            return res.status(200).json({ message: "Category removed" });
        }
        catch (e) {
            return next(e);
        }

    }
    async function updateCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const newPath = RegExp(req.body.new);
            const oldPath = RegExp(req.body.old);
            const existingCategory = await models.Category.findOne({ "path": { $regex: newPath } }).lean();
            if (existingCategory) return res.status(409).send(req.body.new + " name existed!");
            const categoryFound = await models.Category.find({ "path": { $regex: oldPath } });
            if (!categoryFound.length) {
                return res.status(400).json({ message: "No path contains " + req.body.old });
            }
            await Promise.all(
                categoryFound.map((cat) => {
                    const updatedPath = cat.path.replace(oldPath, req.body.new);
                    return models.Category.findByIdAndUpdate(cat._id, { "$set": { "path": updatedPath } }).lean();
                })
            );
            return res.status(200).json("Category updated!");

        }
        catch (error) {
            return next(error);
        }
    }
    async function appendCategory(req: Request, res: Response, next: NextFunction) {
        const { new_path, parent } = req.body;
        console.log(new_path, parent);
        const child = parent + new_path + ",";
        if (parent.split(",").length > 4) {
            return res.status(400).send("No more than 2 child category is allowed");
        }
        try {
            const childIsFound = await models.Category.findOne({ "path": child }).lean();
            if (childIsFound) return res.status(409).send("Child category name used");
            const parentIsFound = await models.Category.findOne({ "path": parent }).lean();
            if (!parentIsFound) return res.status(404).send(parent + " not found");
            const newSubCat = new models.Category({ "path": child });
            await newSubCat.save();
            return res.status(201).json("Sub category added");
        }
        catch (e) {
            return next(e);
        }

    }
    async function getAllCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const { path } = req.query;
            const query = {};
            if (path) query["path"] = { $regex: path, $options: "i" };
            const result = await models.Category.find(query).select("path commission").populate("attributes").lean();
            return res.status(200).send(result);
        } catch (e) {
            return next(e);
        }
    }
    async function updateCommission(req: Request, res: Response, next: NextFunction) {
        console.log(req.body.path);
        const path = RegExp("^," + req.body.path + ",");
        const found = await models.Category.find({ "path": { $regex: path } });
        if (!found.length) { return res.status(404).send("No category found!"); }
        const result = await models.Category.update(
            { "path": { $regex: path } },
            {
                $set: { "commission": req.body.commission }
            },
            {
                multi: true,
                upsert: true
            });
        return res.status(200).json(result.nModified + " commission updated!");
    }
    async function getProductAttributes(req: Request, res: Response, next: NextFunction) {
        try {
            return res.status(200).send(await models.ProductAttribute.find());
        } catch (error) {
            return next(error);
        }
    }
    async function createProductAttributes(req: Request, res: Response, next: NextFunction) {
        try {
            const { name } = req.body;
            if (await models.ProductAttribute.findOne({ "name": name })) {
                return res.status(409).send({ message: "Attribute name conflict" });
            }
            await new models.ProductAttribute(req.body).save();
            return res.status(200).send({ message: "Attribute created" });
        } catch (error) {
            return next(error);
        }
    }
    async function removeProductAttributes(req: Request, res: Response, next: NextFunction) {
        try {
            const { attribute_id } = req.query;
            const removed = await models.ProductAttribute.findByIdAndRemove(attribute_id);
            return res.status(200).send({ message: "Attribute removed" });
        } catch (error) {
            return next(error);
        }
    }
    async function updateProductAttributes(req: Request, res: Response, next: NextFunction) {
        try {
            const { attribute_id, value, variant } = req.body;
            await models.ProductAttribute.findByIdAndUpdate(attribute_id, { $set: { value, variant } });
            return res.status(200).send({ message: "Attribute updated" });
        } catch (error) {
            return next(error);
        }
    }
    async function assginAttributeToCategory(req: Request, res: Response, next: NextFunction) {
        const validationError = await req.getValidationResult();
        if (!validationError.isEmpty()) return res.status(400).json({ "message": validationError.mapped() });
        try {
            // attributes might contain attributes and variants
            const { path, attributes } = req.body;
            const varaints: any = await models.ProductAttribute.find({ _id: { $in: attributes.map(a => Types.ObjectId(a)) } }).select("variant").lean();
            console.log(varaints.filter(v => !v.variant).length);
            if (varaints.filter(v => v.variant).length > 2) return res.status(400).json({ "message": "You cannot assign more than 2 varaint option to this category." });
            const r = await models.Category.findOneAndUpdate({ "path": path }, { $set: { attributes } });
            if (!r) { return next("No such category"); }
            const update = await models.ProductAttribute.update({ "_id": { "$in": attributes.map(id => Types.ObjectId(id)) } }, { $addToSet: { "category": r._id } }, { multi: true });
            return res.status(200).send({ message: "Category attributes assigned" });
        } catch (error) {
            return next(error);
        }
    }
    async function removeAttributeFromCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const { path, attribute_id } = req.body;
            const theCategory = await models.Category.findOneAndUpdate({ "path": path }, { $pull: { attributes: Types.ObjectId(attribute_id) } });
            const update = await models.ProductAttribute.findByIdAndUpdate(attribute_id, { $pull: { "category": Types.ObjectId(theCategory._id) } });
            return res.status(200).send({ message: "Category attributes removed" });
        } catch (error) {
            return next(error);
        }
    }
    async function getVariantOptions(req: Request, res: Response, next: NextFunction) {
        try {
            const { category_id } = req.query;
            const variantsOptions = await models.ProductAttribute.find(
                { "category": Types.ObjectId(category_id), "variant": true },
            );
            console.log(category_id);
            return res.status(200).send(variantsOptions);
        } catch (error) {
            return next(error);
        }
    }

    return {
        postCategory,
        deleteCategory,
        updateCategory,
        appendCategory,
        getAllCategory,
        updateCommission,
        getProductAttributes,
        createProductAttributes,
        removeProductAttributes,
        updateProductAttributes,
        assginAttributeToCategory,
        removeAttributeFromCategory,
        getVariantOptions
    };
};