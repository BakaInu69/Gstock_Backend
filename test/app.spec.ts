import * as chai from "chai";
import * as supertest from "supertest";
module.exports = (request: supertest.SuperTest<supertest.Test>) => {
  describe.only("App configuration stage", function () {
    it("should display server configs", function (done) {
      request
        .get("/")
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect((res: supertest.Response) => {
          chai.expect(res.body).haveOwnProperty("headers");
        })
        .expect(200, done);
    });
  });
};
