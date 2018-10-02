import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import * as _ from "lodash";
import * as mongoose from "mongoose";
import * as passport from "passport";
import * as passportLocal from "passport-local";
// import { Models, AdminModels, BuyerModels, MerchantModels } from "./../models/Schemas";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { UserModel } from "../models/Schemas/User";
const LocalStrategy = passportLocal.Strategy;
// import { IVerifyFunction } from "passport-local";
const opts: any = {
  algorithms: ["HS256", "HS384"],
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWTKEY
};

export interface UserPassport {
  userPassport: passport.Passport;
  isAuthorized(req: Request, res: Response, next: NextFunction): void;
  isAuthenticated(req: Request, res: Response, next: NextFunction): void;
  isJWTValid(req: Request, res: Response, next: NextFunction): void;

}
export class UserPassportClass {
  private userPassport;
  constructor(models) {
    this.userPassport = new passport.Passport();
    this.userPassport.use(new LocalStrategy({ usernameField: "email", passwordField: "password", passReqToCallback: true }, async (req, username, password, done) => {
      try {
        const account = await models.User.findOneAndUpdate({
          "credential.email": username.toLowerCase(),
          "credential.user_group": req.body.user_group
        }, { "credential.last_login": new Date() }).select("credential");
        if (!account) {
          return done(undefined, false, {
            message: `Account ${username} is not found.`,
            detail_code: 100001,
            status_code: 400,
          });
        }
        if (!account.credential.password) {
          return done(undefined, false, {
            message: "Invalid password.",
            detail_code: 100002,
            status_code: 400,
          });
        }
        account.comparePassword(password + "", account.credential.password, (err: Error, isMatch: boolean) => {
          if (err) { return done(err); }
          if (isMatch) {
            return done(undefined, account);
          }
          return done(undefined, false, {
            message: "Invalid password.",
            detail_code: 100002,
            status_code: 400,
          });
        });
      } catch (err) {
        return done(err);
      }
    }));

    this.userPassport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
      try {
        const user = await models.User.findById(jwt_payload.id);
        if (user) {
          return done(undefined, user);
        } else {
          return done(undefined, false, { message: "Not authenticated" });
          // or you could create a new account
        }
      } catch (err) {
        return done(err, false);
      }
    }));
  }
  isJWTValid(req, res, next) {
    this.userPassport.authenticate("jwt", { session: false }, (err: any, user, info) => {
      if (err) { return next(err); }
      if (!user) { return res.status(401).send(info instanceof Error ? { message: info.message } : info); }
      req["user_id"] = mongoose.Types.ObjectId(user.id);
      res.locals = { user };
      req.locals = { user };
      next();
    })(req, res, next);
  }
  getUserPassport() {
    return this.userPassport;
  }
}
export function getUserPassport(models): UserPassport {
  const userPassport = new passport.Passport();
  userPassport.use(new LocalStrategy({ usernameField: "email", passwordField: "password", passReqToCallback: true }, async (req, username, password, done) => {
    try {
      const account = await models.User.findOneAndUpdate({
        "credential.email": username.toLowerCase(),
        "credential.user_group": req.body.user_group
      }, { "credential.last_login": new Date() }).select("credential");
      if (!account) {
        return done(undefined, false, { message: `Account ${username} is not found.` });
      }
      account.comparePassword(password + "", account.credential.password, (err: Error, isMatch: boolean) => {
        if (err) { return done(err); }
        if (isMatch) {
          return done(undefined, account);
        }
        return done(undefined, false, { message: "Invalid password." });
      });
    } catch (err) {
      return done(err);
    }
  }));

  userPassport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      const user = await models.User.findById(jwt_payload.id);
      if (user) {
        return done(undefined, user);
      } else {
        return done(undefined, false, { message: "Not authenticated" });
        // or you could create a new account
      }
    } catch (err) {
      return done(err, false);
    }
  }));
  return {
    userPassport,
    isJWTValid: (req, res, next) => {
      userPassport.authenticate("jwt", { session: false }, (err: any, user: any, info) => {
        if (err) { return next(err); }
        if (!user) { return res.status(401).send(info instanceof Error ? { message: info.message } : info); }
        req["user_id"] = mongoose.Types.ObjectId(user.id);
        res.locals = { user };
        // req.locals = { user };
        next();
      })(req, res, next);
    },
    // isJWTExpired: (req, res, next) => { },
    isAuthorized: (req, res, next) => {
      const provider = req.path.split("/").slice(-1)[0];
      if (_.find(req.user.tokens, { kind: provider })) {
        return next();
      } else {
        return next();
      }
    },
    isAuthenticated: (req, res, next) => {
      if (req.isAuthenticated()) {
        return next();
      }
      return next();
    }
  };
}
