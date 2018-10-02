import { Model } from "mongoose";

export class BaseController {
    constructor(private model: Model<any>) {

    }
    async create(doc) {
        return this.model.create(doc);
    }
    async read(doc) {
        return this.model.find(doc);
    }
    async update(doc, newDoc) {
        return this.model.findOneAndUpdate(doc, newDoc, { new: true });
    }
    async bulkUpdate(doc, newDoc) {
        return this.model.updateMany(doc, newDoc, { new: true });
    }
    async remove(doc) {
        return this.model.findOneAndRemove(doc);
    }
    async bulkDelete(doc) {
        return this.model.remove(doc);
    }
}