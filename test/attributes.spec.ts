import * as chai from "chai";
import * as sinon from "sinon";
import * as mongoose from "mongoose";
import { CategoryModel } from "../src/models/ModelGenerator";
import * as supertest from "supertest";

let request: supertest.SuperTest<supertest.Test>;

describe.skip("Category model", () => {
    before((done) => {
        (
            async () => {
                const app = await require("../src/app")();
                request = supertest(app);
                const productdb = require("../src/dbconnect").productConn();
                done();
            })();
    });
});