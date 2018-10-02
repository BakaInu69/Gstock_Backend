import * as mongoose from "mongoose";
import * as mongoosePaginate from "mongoose-paginate";

export interface MerchantModel {

}
export const validatorGroups = {
    unitPriceMustBeGreaterThanDiscountPrice() {
        return this.unitPrice > this.discountPrice;
    }
};

const merchantSchema = new mongoose.Schema({
    profile: {
        associateToWebsite: String,
        createdFrom: String,
        group: String,
        DOB: Date,
        gender: String,
        prefix: String,
        firstName: String,
        middleName: String,
        lastName: String,
        suffix: String,
    },
    contact: {
        emailForContact: String,
        tel: Number,
        fax: Number
    },
    bankRelated: {
        title: String,
        bankName: String,
        beneficiaryName: String,
        accountNo: String,
        merchantStatus: String
    },
    location: {
        ZIP: String,
        country: String,
        state_province: String
    },
    payment: {
        taxNumber: String,
        vatNumber: Number,
        paymentInfo: String,
        defaultBillingAdd: String
    },
    commission: [{
        cateogry: String,
        commission: Number
    }],
    store: {
        name: String,
        description: String
    },
    newsletter: Boolean
}, {
        timestamps: true,
        minimize: false
    });


merchantSchema.methods.discountPrice = function () {
    console.log(this.price);
    return this.discount ? this.price * 0.9 : this.price;
};
merchantSchema.plugin(mongoosePaginate);
export default merchantSchema;