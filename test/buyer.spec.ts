
import * as chai from "chai";
import * as sinon from "sinon";
import * as bcrypt from "bcrypt-nodejs";
import * as supertest from "supertest";
import { default as Models } from "./../src/models";
import { UserModel } from "../src/models/User";
import { ProductModel } from "../src/models/Product";
import { VariantModel } from "../src/models/Variants";
import * as jwt from "jsonwebtoken";
module.exports = (request: supertest.SuperTest<supertest.Test>, models) => {
    describe("Buyer models", () => {
        let fakeBuyer: UserModel;
        let fakeProduct: ProductModel;
        let fakeVariant: VariantModel;
        let jwtToken: string;
        before(
            async () => {
                fakeBuyer = await new models.User({
                    credential: {
                        email: "123123@qq.com",
                        password: "24444",
                        user_group: "buyer"
                    },
                    profile: {
                        first_name: "Randy"
                    }
                }).save();
                fakeProduct = await new models.Product({
                    is_active: true,
                    status: "Approved",
                    "brief": {
                        "name": "kitchen knife"
                    }
                }).save();
                fakeVariant = await new models.Variant({
                }).save();
                jwtToken = jwt.sign(
                    {
                        id: fakeBuyer.id,
                        user_group: "buyer",
                        timestamp: new Date(),
                        expired: 900
                    },
                    process.env.JWTKEY);
            });
        describe("Buyer profile management for buyer", () => {
            before(
                async () => {
                });
            it("should get buyer profile by user_id", async () => {
                await request
                    .get("/user/account/detail")
                    .set("Accept", "application/json")
                    .set("Authorization", "Bearer " + jwtToken)
                    .expect((res: supertest.Response) => {
                        chai.expect(res.body).haveOwnProperty("profile");
                    })
                    .expect(200);
            });
            it("should update buyer profile", async () => {
                await request
                    .put("/user/account/detail")
                    .set("Accept", "application/json")
                    .set("Authorization", "Bearer " + jwtToken)
                    .send({
                        "profile": {
                            "first_name": "Randyyyyy"
                        }
                    })
                    .expect((res: supertest.Response) => {
                        chai.expect(res.body).to.haveOwnProperty("profile");
                    })
                    .expect(200);
            });
        });
        describe.only("Buyer cart management for buyer", () => {
            before(
                async () => { });
            it("should add product_id to cart", async () => {
                await request
                    .post("/buyer/cart")
                    .set("Accept", "application/json")
                    .set("Authorization", "Bearer " + jwtToken)
                    .send({
                        product_id: fakeProduct.id,
                        variant_id: fakeVariant.id,
                        qty: 3,
                    })
                    .expect(201)
                    .expect((res: supertest.Response) => {
                        chai.expect(res.body.message).equals("Added to cart.");
                    });
            });

            it("should increment product qunatity", (done) => {
                request
                    .post("/buyer/cart")
                    .set("Accept", "application/json")
                    .set("Authorization", "Bearer " + jwtToken)
                    .send({
                        product_id: fakeProduct.id,
                        variant_id: fakeVariant.id,
                        qty: 3,
                    })
                    .expect((res: supertest.Response) => {
                        chai.expect(res.body.message).equals("Added to cart.");
                    })
                    .expect(201, done);
            });
            it("should get product from cart", async () => {
                await request
                    .get("/buyer/cart")
                    .set("Accept", "application/json")
                    .set("Authorization", "Bearer " + jwtToken)
                    .expect((res: supertest.Response) => {
                        // chai.expect(res.body.qty).equals(6);
                        chai.expect(res.body.cart).to.be.an("array").lengthOf(1);
                    })
                    .expect(200);
            });
            it.skip("should checkout with correct amount", async () => {
                await request
                    .post("/buyer/cart/checkout")
                    .set({
                        Accept: "application/json",
                        Authorization: "Bearer " + jwtToken
                    })
                    .send(
                        [
                            {
                                products: [
                                    {
                                        variants: [
                                            {
                                                dP: 11,
                                                qty: 1,

                                            },
                                            {
                                                dP: 3,
                                                qty: 2,

                                            },
                                            {
                                                dP: 2,
                                                qty: 4,
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                products: [
                                    {
                                        variants: [
                                            {
                                                dP: 5,
                                                qty: 1,
                                            },
                                        ]
                                    }
                                ]
                            },
                            {
                                products: [
                                    {
                                        variants: [

                                        ]
                                    }
                                ]
                            }
                        ]
                    )
                    .expect((res: supertest.Response) => {

                        console.log(res.body);

                    })
                    .expect(200);
            });
        });
    });
};