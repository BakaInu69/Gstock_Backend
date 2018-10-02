import * as mongoose from "mongoose";

export type TransactionModel = mongoose.Document & {
    orderID: string,
    buyerID: string,
    paymentMethod: string,
    wallet: string,
    amount: number,
    status: string
};


const transactionSchema = new mongoose.Schema({
    orderID: String,
    buyerID: String,
    paymentMethod: String,
    wallet: String,
    amount: Number,
    status: String
},
    { timestamps: true, minimize: false });


const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;