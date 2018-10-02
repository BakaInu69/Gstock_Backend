import { NextFunction, Request, Response } from "express";
const https = require("https");

export default (config) => {
    const { passport: { userPassport: { userPassport } }, models } = config;
    function sendOrderToLogisticProvider(req: Request, res: Response, next: NextFunction) {
        const options = {
            hostname: "api.beta.6connect.biz",
            path: "/api/6connect/store/order/add",
            method: "POST",
            headers: {
                "6Connect-Access-Token": process.env.LOGISTIC_PROVIDER_API_KEY,
                "content-type": "application/json",
                "accept": "application/json"
            }
        };
        const body = {
            "orderNo": "9962131469",
            "orderName": "DD",
            "lineItems": [{
                "id": "123123",
                "name": "Hunt T-Shirt",
                "sku": "11456873613",
                "quantity": "1"
            }],
            "shippingAddress": {
                "firstName": "Hunt",
                "lastName": "Wu",
                "company": "6connect",
                "address1": "Address line 1",
                "address2": "Address line 2",
                "city": "taipei",
                "postalCode": "541723",
                "country": "singapore",
                "email": "a5335257@gmail.com",
                "phone": "99601234"
            },
            "orderCreatedOn": "2017-10-24 12:15:25",
            "orderPayload": JSON.stringify(req.body.payload || {})
        };
        const reqOut = https.request(options, (resOut) => {
            resOut.setEncoding("utf8");
            resOut.on("data", (chunk) => {
                res.status(200).send(JSON.parse(chunk));
            });
            res.on("end", () => {
                console.log("No more data in response.");
            });
        });

        req.on("error", (e) => {
            console.error(`problem with request: ${e.message}`);
        });

        // write data to request body
        reqOut.write(JSON.stringify(body));
        reqOut.end();


    }
    function getWebhook(req: Request, res: Response, next: NextFunction) {
        console.log(req.body);
        return res.status(200).send({ "message": "Received" });
    }
    return {
        getWebhook,
        sendOrderToLogisticProvider
    };
};