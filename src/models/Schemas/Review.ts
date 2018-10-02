import * as mongoose from "mongoose";

export type ReviewModel = mongoose.Document & {
    productID: string,
    merchantID: string,
    detail: {
        rating: number,
        title: string,
        comment: string,
        type: string
    }
};


const reviewSchema = new mongoose.Schema({
    productID: String,
    merchantID: String,
    detail: {
        rating: Number,
        title: String,
        comment: String,
        type: String
    }
},
    { timestamps: true, minimize: false });


const Review = mongoose.model("Review", reviewSchema);

export default Review;