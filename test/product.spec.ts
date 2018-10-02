
import * as chai from "chai";
import * as sinon from "sinon";


import { ProductModel } from "../src/models/Product";
import * as supertest from "supertest";


module.exports = (request: supertest.SuperTest<supertest.Test>, models: any) => {
    describe("", () => {
        before(async () => {
            const mockProducts = require("./mock/product.mock.json");
            await models.Product.insertMany(mockProducts);
        });
        it("should show paginated products and return min and max price", async () => {
            await request
                .get("/product/list")
                .set("Accept", "application/json")
                .expect((res: supertest.Response) => {
                    chai.expect(res.body.docs).to.be.an("array").length.gte(1);
                    chai.expect(res.body.max_price).eq(25);
                    chai.expect(res.body.min_price).eq(0.4);
                })
                .expect(200);
        });

        it("should show paginated products?low=3&high=7", async () => {
            await request
                .get("/product/list")
                .set("Accept", "application/json")
                .expect((res: supertest.Response) => {
                    chai.expect(res.body.docs).to.be.an("array").length.gte(1);
                })
                .expect(200);
        });
    });


    describe.skip("Promotion", () => {
        it("should check for expiration", (done) => {
            request
                .post("/product/promotion")
                .set("Accept", "application/json")
                .send({
                    promoCode: "11.11"
                })
                .expect((res: supertest.Response) => {
                    chai.expect(res.body.detail).to.equal("Promotion expired");
                })
                .expect(200, done);
        });
    });
};