import * as supertest from "supertest";
import { GApp } from "../src/app";
let request: supertest.SuperTest<supertest.Test>;
let modelsS;
describe("Setting up", () => {
    before(async () => {
        const { app, models } = await new GApp("buyer", 3000).app();
        modelsS = models;
        request = supertest(app);
    });
    it("App set up", () => {
        require("./app.spec.ts")(request);
    });
    it("Authentication", () => {
        require("./auth.spec.ts")(request, modelsS);
    });
    it("Merchant model", () => {
        require("./merchant.spec.ts")(request);
    });
    it.only("Buyer model", () => {
        require("./buyer.spec.ts")(request, modelsS);
    });
    it("Admin model", () => {
        require("./admin.spec.ts")(request);
    });
    it("Product model", () => {
        require("./product.spec.ts")(request, modelsS);
    });
    it("Category model", () => {
        require("./category.spec.ts")(request);
    });
    it("User model", () => {
        require("./user.spec.ts")(request);
    });
});
