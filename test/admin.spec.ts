import { UserModel } from "../src/models/User";
import * as mongoose from "mongoose";
import * as chai from "chai";
import * as supertest from "supertest";
import { Models } from "./../src/models/ModelGenerator";
module.exports = (request: supertest.SuperTest<supertest.Test>) => {
    describe("Admin model", () => {
        const models: Models = require("./../src/app")["admin"].models;
        let fakeMerchant: UserModel;
        before(async () => {
            fakeMerchant = await new models.User({
                credential: {
                    "email": "1234567@qq.com",
                    "password": "123456",
                    "confirm_password": "123456",
                    "user_group": "merchant",
                    "user_name": "大冬瓜"
                }
            }).save();
        });
        describe.skip("User management", () => {
            it("should create a new user", (done) => {
                request
                    .post("/admin/user/create")
                    .set("Accept", "application/json")
                    .send({
                        "email": "123456@qq.com",
                        "password": "123456",
                        "confirmPassword": "123456",
                        "userGroup": "merchant",
                        "userName": "大傻逼"
                    })
                    .expect((res: supertest.Response) => {
                        chai.expect(res.error.text).to.be.undefined;
                        chai.expect(res.body).is.a("string").that.equals("User Created");
                    })
                    .expect(201, done);
            });
            it("should return all users when no query object is passed", (done) => {
                request
                    .get("/admin/user/credential/?limit=3&offset=0")
                    .set("Accept", "application/json")
                    .send()
                    .expect((res: supertest.Response) => {
                        chai.expect(res.error.text).to.be.undefined;
                        chai.expect(res.body.docs).is.an("array").that.has.lengthOf(2);
                        console.log(res.body.docs);
                    })
                    .expect(200, done);
            });
            it("should return users with the correct userGroup", (done) => {
                request
                    .get("/admin/user/detail/?limit=3&offset=0&userGroup=merchant")
                    .set("Accept", "application/json")
                    .send()
                    .expect((res: supertest.Response) => {
                        chai.expect(res.error.text).to.be.undefined;
                        chai.expect(res.body.docs).is.an("array").that.has.lengthOf(1);
                    })
                    .expect(200, done);
            });
            it("should update users given userGroup and id", (done) => {
                request
                    .get("/admin/user/detail/?limit=3&offset=0&userGroup=merchant")
                    .set("Accept", "application/json")
                    .send()
                    .expect((res: supertest.Response) => {
                        chai.expect(res.error.text).to.be.undefined;
                        chai.expect(res.body.docs).is.an("array").that.has.lengthOf(1);
                    })
                    .expect(200, done);
            });
        });
        describe.only("Product management", () => {
            let products: any = [];
            before(async () => {
                await models.Product.insertMany([{
                    "merchant_id": mongoose.Types.ObjectId(fakeMerchant._id),
                    "brief": {
                        "name": "missle",
                        "category": ",Baby & Kids,Baby Girl,Tops,"
                    }
                },
                {
                    "merchant_id": fakeMerchant._id,
                    "brief": {
                        "name": "artillery",
                        "category": ",Baby & Kids,Baby Girl,Tops,"
                    }
                },
                {
                    "merchant_id": fakeMerchant.id,
                    "brief": {
                        "name": "tank",
                        "category": ",Baby & Kids,Baby Girl,Tops,"
                    }
                },
                {
                    "merchant_id": mongoose.Types.ObjectId(fakeMerchant._id),
                    "brief": {
                        "name": "fighter",
                        "category": ",Health & Beauty,Food Supplements,Sports Nutrition,"
                    }
                },
                {
                    "merchant_id": fakeMerchant._id,
                    "brief": {
                        "name": "hippo tank",
                        "category": ",Health & Beauty,Food Supplements,Sports Nutrition,"
                    }
                }
                ]);
                products = await models.Product.find();
            });
            it("should approve a product ", async () => {
                await request
                    .put("/admin/product/approve/" + products[0]._id)
                    .set("Accept", "application/json")
                    .expect((res: supertest.Response) => {
                        chai.expect(res.error.text).to.be.undefined;
                        chai.expect(res.body).to.equal("Product approved");
                    })
                    .expect(200);
            });
            it("should disapprove a product ", async () => {
                const products = await models.Product.find();
                await request
                    .put("/admin/product/disapprove/" + products[0]._id)
                    .set("Accept", "application/json")
                    .expect((res: supertest.Response) => {
                        chai.expect(res.error.text).to.be.undefined;
                        chai.expect(res.body).to.equal("Product disapproved");
                    })
                    .expect(200);
            });
            it("should search for disapproved products ", (done) => {
                request
                    .post("/admin/product/search")
                    .set("Accept", "application/json")
                    .send({
                        "status": "Disapproved"
                    })
                    .expect((res: supertest.Response) => {
                        chai.expect(res.error.text).to.be.undefined;
                        chai.expect(res.body.docs).to.be.an("array").lengthOf(1);
                    })
                    .expect(200, done);
            });
            it("should search for product name that contains 'tank' ", (done) => {
                request
                    .post("/admin/product/search")
                    .set("Accept", "application/json")
                    .send({
                        "name": "tank"
                    })
                    .expect((res: supertest.Response) => {
                        chai.expect(res.error.text).to.be.undefined;
                        chai.expect(res.body.docs).to.be.an("array").lengthOf(2);
                    })
                    .expect(200, done);
            });
            it("should search for product name that has category 'Sports Nutrition' ", (done) => {
                request
                    .post("/admin/product/search")
                    .set("Accept", "application/json")
                    .send({
                        "category": "Sports Nutrition"
                    })
                    .expect((res: supertest.Response) => {
                        chai.expect(res.error.text).to.be.undefined;
                        chai.expect(res.body.docs).to.be.an("array").lengthOf(2);
                    })
                    .expect(200, done);
            });
        });
        describe.skip("Promotion management", () => {
            it("should create a new promotion called 11.11", (done) => {
                request
                    .post("/admin/promotion")
                    .set("Accept", "application/json")
                    .send({
                        name: "Double 11",
                        detail: "Fake double 11",
                        promoCode: "11.11",
                        category: ["storewide"],
                        shipment: false,
                        value: "5",
                        status: "pending",
                        start: new Date(Date.now() - 10000),
                        end: new Date(Date.now())
                    })
                    .expect((res: supertest.Response) => {
                        chai.expect(res.error).to.be.false;
                        chai.expect(res.body).equals("Promotion created");
                    })
                    .expect(201, done);
            });
            it("list all promotion regardless of status", (done) => {
                request
                    .post("/admin/promotion/search")
                    .set("Accept", "application/json")
                    .send()
                    .expect((res: supertest.Response) => {
                        chai.expect(res.error.text).to.be.undefined;
                        chai.expect(res.body).is.an("array").lengthOf(1);
                    })
                    .expect(200, done);
            });
            it("lists all expired promotion", (done) => {
                request
                    .post("/admin/promotion/search")
                    .set("Accept", "application/json")
                    .send({
                        query: {
                            status: "Active"
                        }
                    })
                    .expect((res: supertest.Response) => {
                        chai.expect(res.error.text).to.be.undefined;
                        chai.expect(res.body).is.an("array").lengthOf(1);
                    })
                    .expect(200, done);
            });
        });
        describe.skip("Order management", () => {
            it("should return all order", (done) => {
                request
                    .post("/admin/orders/search")
                    .set("Accept", "application/json")
                    .expect((res: supertest.Response) => {
                        chai.expect(res.error).to.be.false;
                        console.log(res.body);
                    })
                    .expect(200, done);
            });

            it("should update order status", async () => {
                await request
                    .put("/admin/orders")
                    .set("Accept", "application/json")
                    .send({
                        "query": {
                            "status": "Awaiting Payment"
                        },
                        "update": {
                            "status": "Delivering"
                        }
                    })
                    .expect((res: supertest.Response) => {
                        chai.expect(res.error).to.be.false;
                        chai.expect(res.body.detail).to.equal("Order status updated");
                    })
                    .expect(200);
            });
            it("should return all order", (done) => {
                request
                    .post("/admin/orders/search")
                    .set("Accept", "application/json")
                    .send({
                        "query": {
                            "status": "Delivering"
                        }
                    })
                    .expect((res: supertest.Response) => {
                        chai.expect(res.body).to.be.an("array").lengthOf(1);
                    })
                    .expect(200, done);
            });
        });
    });
};