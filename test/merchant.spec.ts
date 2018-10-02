import { ProductModel } from "../src/models/Product";
import { UserModel } from "../src/models/User";
import { VariantModel } from "../src/models/Variant";
import { Model } from "mongoose";
import * as chai from "chai";
import * as supertest from "supertest";


const productArray = function toPush(n: number, uP: number, dP: number): Array<object> {
    if (n === 0) {
        return [];
    }
    return toPush(n - 1, uP, dP).concat([{
        "brief": {
            "name": "Toy car",
            "short_escription": "Toy gun",
            "stock": 5,
            "image": "base6554",
        }
    }]);

};

function simpleProductArray(n: number): Array<object> {
    const array = [];
    for (let i = 0; i < n; i++) {
        array.push({
            "productName": "Toy car",
            "productDescription": "Toy gun",
            "stock": 50,
            "picture": "base6554",
            "uP": 1000,
            "dP": 120,
            "variants": [
                {
                    "SKU": i,
                    "option": i,
                    "stock": 50,
                    "uP": 1000,
                    "dP": 120,
                }
            ]
        });
    }
    return array;
}
module.exports = (request: supertest.SuperTest<supertest.Test>, models: any) => {
    describe.skip("Proudct managemnet for merchant", async () => {
        let mockMerchant: UserModel;
        before(async () => {
            mockMerchant = await new models.User({
                crendential: {
                    user_group: "merchant",
                }
            }).save();
        });
        it("should get a merchant account", async function () {
            await request
                .get("/merchant/account/" + mockMerchant.id)
                .set("Accept", "application/json")
                .expect((res: supertest.Response) => {
                    chai.expect((res.error.text)).to.be.undefined;
                })
                .expect(200);
        });
        it("should update a merchant account", async function () {
            await request
                .put("/merchant/account/" + mockMerchant.id)
                .set("Accept", "application/json")
                .send({
                    "id": mockMerchant.id,
                    "profile": {
                        "gender": "M",
                        "DOB": "1993-4-27"
                    },
                    "location": {
                        "ZIP": "S657883"
                    }
                })
                .expect(200);
        });
        it("should add a product to product listing", (done) => {
            request
                .post("/merchant/product/" + mockMerchant.id)
                .set("Accept", "application/json")
                .send({
                    "brief": {
                        "name": "Dog food"
                    }
                })
                .expect((res: supertest.Response) => {
                    chai.expect((res.error.text)).to.be.undefined;
                    chai.expect(res.body).to.equals("New products added");
                })
                .expect(201, done);
        });
        let productArrayCreated: Array<ProductModel> = [];
        it("should get and read a product from merchant id", function (done) {
            request
                .get("/merchant/product/" + mockMerchant.id)
                .set("Accept", "application/json")
                .expect((res: supertest.Response, ) => {
                    productArrayCreated = res.body.docs;
                    chai.expect(res.body.docs).to.be.an("array").lengthOf(1);
                    chai.expect(res.body.docs[0]).to.haveOwnProperty("brief");
                })
                .expect(200, done);

        });
        it("should post and update a product given product id", function (done) {
            request
                .put("/merchant/product/" + productArrayCreated[0].id)
                .set("Accept", "application/json")
                .send(
                {
                    "brief": {
                        "name": "Toy Sword"
                    }
                })

                .expect((res: supertest.Response) => {
                    chai.expect(res.body).to.be.equal("Product updated!");
                })
                .expect(200, done);
        });
        it("should post and delete products given ids", async () => {
            const Product = require("../src/models/ModelGenerator").Product;
            request
                .delete("/merchant/product")
                .set("Accept", "application/json")
                .send({
                    "id": mockMerchant.id,
                    "productArray": productArrayCreated.splice(1)
                })
                .expect((res: supertest.Response) => {
                    chai.expect(res.body.docs).to.be.an("array").lengthOf(0);
                })
                .expect(200);
        });
    });
    describe("Product variants managemnet for merchant", async () => {
        let mockMerchant: UserModel;
        let mockProduct: ProductModel;
        before(async () => {
            mockMerchant = await new models.User({
                crendential: {
                    user_group: "merchant",
                }
            }).save();
            mockProduct = await new models.Product({
                "merchant_id": mockMerchant.id
            });
            await (<Model<VariantModel>>models.Variant).insertMany([
                {
                    product_id: mockProduct.id,
                    name: "/flavor/size/color",
                    value: "/sweet/small/red",
                },
                {
                    product_id: mockProduct.id,
                    name: "/flavor/size/color",
                    value: "/sweet/small/green",
                },
                {
                    product_id: mockProduct.id,
                    name: "/flavor/size/color",
                    value: "/neutral/small/yellow",
                },
                {
                    product_id: mockProduct.id,
                    name: "/flavor/size/color",
                    value: "/sweet/small/black",
                },
                {
                    product_id: mockProduct.id,
                    name: "/flavor/size/color",
                    value: "/sweet/medium/red",
                },
            ]);
        });
        it("should create product variant given product id", (done) => {
            request
                .post("/merchant/variant/" + mockProduct.id)
                .set("Accept", "application/json")
                .send({
                    name: "/flavor/size/color",
                    value: "/bitter/big/red",
                    price: 4,
                    discount_price: 6,
                    image: "big.jpg",
                    stock: 1230,
                    sku: "ASD-1231",
                })
                .expect((res: supertest.Response) => {
                    chai.expect(res.error.text).to.be.undefined;
                })
                .expect(200, done);
        });
        it("should get product variants array given product id", (done) => {
            request
                .get("/merchant/variant/" + mockProduct.id)
                .set("Accept", "application/json")
                .expect((res: supertest.Response) => {
                    chai.expect(res.error.text).to.be.undefined;
                    chai.expect(res.body).to.be.an("array").lengthOf(1);
                })
                .expect(200, done);
        });
        it("should get all the variant option ", (done) => {
            request
                .get("/merchant/variant/options/" + mockProduct.id)
                .set("Accept", "application/json")
                .expect((res: supertest.Response) => {

                    chai.expect(res.error.text).to.be.undefined;
                    chai.expect(res.body.options["flavor"]).to.be.an("array").lengthOf(1);
                    chai.expect(res.body.options["size"]).to.be.an("array").lengthOf(1);
                    chai.expect(res.body.options["color"]).to.be.an("array").lengthOf(1);
                })
                .expect(200, done);
        });

        it.skip("should update product variant option given variant id", (done) => {
            request
                .get("/merchant/variant/" + mockProduct.id)
                .set("Accept", "application/json")
                .send({})
                .expect((res: supertest.Response) => {
                    chai.expect(res.error.text).to.be.undefined;
                    chai.expect(res.body).to.be.an("array").lengthOf(1);
                })
                .expect(200, done);
        });
    });

};