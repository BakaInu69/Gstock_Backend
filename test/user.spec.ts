import * as chai from "chai";
import * as sinon from "sinon";
import * as mongoose from "mongoose";
import * as bcrypt from "bcrypt-nodejs";
import * as supertest from "supertest";
import * as jwt from "jsonwebtoken";
import { UserModel } from "../src/models/User";
module.exports = (request: supertest.SuperTest<supertest.Test>, models: any) => {
    describe("", () => {
        // const userSchema = require("../src/models/User").default;
        before(async () => {
        });

        // it("should have comparePassword method", () => {
        //     chai.expect(userSchema.methods).to.be.an("object");
        //     chai.expect(userSchema.methods).to.have.property("comparePassword");
        // });
        let token: string;
        let userID: string;
        let verifToken: string;
        it("should register a user and send welcome email", async () => {
            const genSalt = sinon.spy(bcrypt, "genSalt");
            const hash = sinon.spy(bcrypt, "hash");
            await request
                .post("/user/register")
                .set("Accept", "application/json")
                .send(
                {
                    "email": "1234@qq.com",
                    "password": "1234@qq.com",
                    "confirm_password": "1234@qq.com",
                    "user_group": "merchant"
                })
                .expect((res: supertest.Response, err: Error) => {
                    chai.expect(res.error.text).to.be.undefined;
                    sinon.assert.called(genSalt);
                    sinon.assert.called(hash);
                    verifToken = res.body.token;
                })
                .expect(200);
        });
        it("should activate email when token match", async () => {
            await request
                .post("/user/verifyemail")
                .set("Accept", "application/json")
                .send(
                {
                    "email": "1234@qq.com",
                    "token": verifToken,
                })
                .expect((res: supertest.Response, err: Error) => {
                    chai.expect(res.error.text).to.be.undefined;
                })
                .expect(200);
        });
        it("should login a merchant and return JWT token", async () => {
            const compare = sinon.spy(bcrypt, "compare");
            await request
                .post("/user/login")
                .set("Accept", "application/json")
                .send({
                    "email": "1234@qq.com",
                    "password": "1234@qq.com",
                })
                .expect((res: supertest.Response, err: Error) => {
                    chai.expect(res.error.text).to.be.undefined;
                    chai.expect(res.body.token).to.be.a("string");
                    sinon.assert.called(compare);
                    userID = res.body._id;
                    token = res.body.token;
                })
                .expect(200);
        });

        it.skip("should parse a token", async () => {
            const verify = sinon.spy(jwt, "verify");
            await request
                .post("/auth")
                .set("Accept", "application/json")
                .set("Authorization", "JWT " + token)
                .send({
                    "_id": userID
                })
                .expect((res: supertest.Response, err: Error) => {
                    sinon.assert.called(verify);
                    chai.expect(verify.calledWith(token)).to.be.true;
                })
                .expect(200);
        });

    });
};
