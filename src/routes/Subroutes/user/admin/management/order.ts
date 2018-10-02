import { Request, Response, NextFunction, Router } from "express";
import * as PDFkit from "pdfkit";
import { OrderController } from "../../../../../controllers/order";
import * as _ from "lodash";
/**
 * Order Management
 */
export default (config) => {
    const orderCtrl = new OrderController(config);
    const {
        deleteOrder,
        getOrder,
        adminSearchOrder,
        adminGetOrderComplain
    } = _.bindAll(orderCtrl, Object.getOwnPropertyNames(OrderController.prototype));
    return Router()
        .get("/", getOrder("admin"))
        .post("/search", adminSearchOrder)
        .put("/status", )
        // .get("/invoice", async (req: Request, res: Response, next: NextFunction) => {
        //     console.log("invoice");
        //     const doc = new PDFkit;
        //     doc.on("pageAdded", () => {
        //         doc.circle(280, 200, 50).fill("#6600FF");
        //     });
        //     try {
        //         doc.pipe(res);
        //         doc.text("My man!!!!");
        //         doc.addPage();
        //     } catch (e) {
        //         return res.status(400).send(e);
        //     }
        //     doc.end();
        //     return;
        // })
        .get("/complaint", adminGetOrderComplain)
        .post("/bulk/delete", deleteOrder);
};