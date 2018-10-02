import * as chai from "chai";
import * as supertest from "supertest";
module.exports = (request: supertest.SuperTest<supertest.Test>, models) => {
  let token;
  describe.only("Authentication", function () {
    let fakeBuyer;
    before(async () => {
      fakeBuyer = await new models.User({
        credential: {
          email: "123123@qq.com",
          password: "123123",
          user_group: "buyer"
        },
        profile: {
          first_name: "Randy"
        }
      }).save();
    });
    it.skip("should register a user", function (done) {
      request
        .post("/user/register")
        .set("Content-Type", "application/json")
        .send({
          email: "1231234@qq.com",
          password: "1231234",
          confirm_password: "1231234",
          user_group: "buyer",
          first_name: "Randy"
        })
        // .expect("Content-Type", /json/)
        .expect((res: supertest.Response) => {
          console.log(res.body);
          chai.expect(res.body).haveOwnProperty("token");
        })
        .expect(200, done);
    });
    it("should login a user", function (done) {
      request
        .post("/user/login")
        .set("Content-Type", "application/json")
        .send({
          email: "123123@qq.com",
          password: "123123",
          user_group: "buyer"
        })
        // .expect("Content-Type", /json/)
        .expect((res: supertest.Response) => {
          token = res.body.token;
          chai.expect(res.body).haveOwnProperty("token");
        })
        .expect(200, done);
    });
    it("should change a passwod", function (done) {
      request
        .post("/user/account/reset")
        .set("Content-Type", "application/json")
        .set("Authorization", `Bearer ${token}`)
        .send({
          password: "1231234",
          confirm_password: "1231234",
          old_password: "123123",
        })
        .expect((res: supertest.Response) => {
          console.log(res.body);
          chai.expect(res.body).haveOwnProperty("token");
        })
        .expect(200, done);
    });

  });
};
