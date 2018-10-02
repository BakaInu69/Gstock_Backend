import * as chai from "chai";
import * as sinon from "sinon";
import * as mongoose from "mongoose";
import { CategoryModel } from "../src/models/ModelGenerator";
import * as supertest from "supertest";


module.exports = (request: supertest.SuperTest<supertest.Test>, models: any) => {
    describe("", () => {
        before(
            async () => {
                await models.Category.insertMany([
                    { "path": ",Electronic" },
                    { "path": ",Electronic,Mobile Device" },
                    { "path": ",Book" },
                    { "path": ",Book,Kid" },
                    { "path": ",Book,Adult,Woman" },
                    {
                        "path": ",Electronic,Mobile Device,Iphone",
                        "commission": "4"
                    },
                    {
                        "path": ",Electronic,Desktop Device,Ipad",
                        "commission": "3"
                    },
                    { "path": ",Electronic,Desktop Device" },
                    {
                        "path": ",Electronic,Gaming Device,Nintendo",
                        "commission": "2"
                    },
                    { "path": ",Electronic,Gaming Device" },
                ]);
            });

        describe("Category CRUD", () => {
            it("should create a unique main category", (done) => {
                request
                    .post("/category")
                    .set("Accept", "application/json")
                    .send({
                        "name": "Food"
                    })
                    .expect(201, () => {
                        request
                            .post("/category")
                            .set("Accept", "application/json")
                            .send({
                                "name": "Food"
                            })
                            .expect(409, done);
                    });
            });
            it("should find based on category", async () => {
                request
                    .get("/category/read/Mobile%20Device")
                    .set("Accept", "application/json")
                    .expect(
                    (res: supertest.Response) => {
                        chai.expect(res.body).to.be.an("array").lengthOf(2);
                        chai.expect(res.error).to.be.null;
                    })
                    .expect(200);
            });
            it("should update selected cateogry", (done) => {
                request
                    .put("/category")
                    .send({
                        "old": "Gaming Device",
                        "new": "Washing Device"
                    })
                    .set("Accept", "application/json")
                    .expect(200, () => {
                        request
                            .get("/category/read/Gaming%20Device")
                            .set("Accept", "application/json")
                            .expect((res: supertest.Response) => {
                                chai.expect(res.body).to.be.null;
                            })
                            .expect(200, done);
                    });
            });
            it("should append a subcategory", (done) => {
                request
                    .post("/category/append")
                    .set("Accept", "application/json")
                    .send(
                    {
                        "parent": ",Electronic,Desktop Device",
                        "child": "PS2",
                    })
                    .expect(201, done);

            });
            it("should 400 when no parent category is found", (done) => {
                request
                    .post("/category/append")
                    .set("Accept", "application/json")
                    .send(
                    {
                        "parent": ",Electronic,Book",
                        "child": "PS4",
                    })
                    .expect((res: supertest.Response) => {
                        chai.expect(res.error.text).exist;
                    })
                    .expect(404, done);

            });
            it("should 400 when tring to add more than 2 child category", (done) => {
                request
                    .post("/category/append")
                    .set("Accept", "application/json")
                    .send(
                    {
                        "parent": ",Electronic,Book,Name",
                        "child": "PS4",
                    })
                    .expect((res: supertest.Response) => {
                        chai.expect(res.error.text).exist;
                    })
                    .expect(400, done);

            });
            it("should remove selected category", (done) => {
                request
                    .post("/category/delete")
                    .set("Accept", "application/json")
                    .send(
                    {
                        "category": "Electronic",
                    })
                    .expect(200, done);
            });
            it("should return all category", (done) => {
                request
                    .get("/category/all")
                    .set("Accept", "application/json")
                    .expect((res: supertest.Response) => {
                        chai.expect(res.body).to.be.an("array").lengthOf(4);
                    })
                    .expect(200, done);
            });
        });
        describe("Commission CRUD", () => {
            it("should update category comission", (done) => {
                request
                    .put("/category/commission")
                    .set("Accept", "application/json")
                    .send({
                        path: ",Book,Adult,Woman",
                        commission: 5
                    })
                    .expect(200, done);
            });
            it("should 400 if path contains not exactly 2 child ", (done) => {
                request
                    .put("/category/commission")
                    .set("Accept", "application/json")
                    .send({
                        path: ",Book,Adult",
                        commission: 5
                    })
                    .expect(400, done);
            });
        });
    });
};