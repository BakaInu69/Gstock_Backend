import { UserModel } from "../models/Schemas/User";
import { AdminModel } from "../models/Schemas/Admin";

declare module 'express' {
    export interface Response {
        locals: {
            user?: UserModel
            admin?: AdminModel
            welcome?: boolean
            pendingStock?: any;
            orderIds?: any;
            promotions?: any;
            orderDetails?: any;
            cart?: any;
            orderForReport?: any;
            default_delivery?:any;
        }
    }
}

