import { Connection } from "mongoose";
import * as mongoose from "mongoose";
import { dbLogger } from "./logger";
// import { Mockgoose } from "mockgoose";
mongoose.set("debug",
    (coll, method, query, doc, options) => {
        dbLogger.log({
            level: "info",
            source: "db",
            message: JSON.stringify({
                coll,
                method,
                query,
                doc,
                options
            })
        });
    }
);
(<any>mongoose).Promise = global.Promise;
/**
 * Connect to MongoDB.
 */
export class DatabaseConnection {
    constructor(private role: string) {

    }
    async connect() {
        if (process.env.NODE_ENV === "test") {
            // const mockgoose = new Mockgoose(mongoose);
            // await mockgoose.prepareStorage();
            // console.log("Mock DB connected");
            // return await mongoose.connect("mongodb://localhost/", { useMongoClient: true });
        } else {
            console.log("Running ", process.env.MONGODB_DATABASE);
             const connection = await mongoose.createConnection(process.env.MONGODB_URI, { useMongoClient: true, })
                .on("connected", () => {
                    console.log("Database connected");
                    console.log("I am opened only once!");
                })
                .on("error", () => {
                    console.log("Whoops");
                    console.log("Something wrong!");
                })
                .on("closed", () => {
                    console.log("I am closed!");
                });
                return connection.useDb(process.env.MONGODB_DATABASE);
            }
        }
    }
// }
// switch (this.role) {
//     case "admin": {
//         const admin_uri = process.env.MONGODB_URI_ADMIN;
//         // console.log("reading", process.env, admin_uri);
//         console.log("Admin connected");
//         return await mongoose.createConnection(admin_uri, { useMongoClient: true, });
//     }
//     case "merchant": {
//         const merchant_uri = process.env.MONGODB_URI_MERCHANT;
//         console.log("reading", merchant_uri);
//         console.log("Merchant connected");
//         return await mongoose.createConnection(merchant_uri, { useMongoClient: true, });
//     }
//     case "buyer": {
//         const buyer_uri = process.env.MONGODB_URI_BUYER;
//         console.log("reading", buyer_uri);
//         return await mongoose.createConnection(buyer_uri, { useMongoClient: true, })
//             .on("connected", () => {
//                 console.log("Buyer connected");
//                 console.log("I am opened only once!");
//             })
//             .on("error", () => {
//                 console.log("Whoops");
//                 console.log("Something wrong!");
//             })
//             .on("closed", () => {
//                 console.log("I am closed!");
//             });
//     }
// }