import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import * as _ from "lodash";
import * as passport from "passport";
import * as passportLocal from "passport-local";
import { Types } from "mongoose";

const LocalStrategy = passportLocal.Strategy;
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { AdminModel } from "../models/Schemas/Admin";



const opts: any = {};
opts.algorithms = ["HS256", "HS384"];
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();

opts.secretOrKey = process.env.JWTKEY;


export interface AdminPassport {
  adminPassport: passport.Passport;
  isAuthorized(req: Request, res: Response, next: NextFunction): void;
  isAuthenticated(req: Request, res: Response, next: NextFunction): void;
  isJWTValid(req: Request, res: Response, next: NextFunction): void;
}

export function getAdminPassport(models): AdminPassport {
  const adminPassport = new passport.Passport();
  adminPassport.use(new LocalStrategy({ usernameField: "email", passwordField: "password" }, async (email, password, done) => {
    try {
      const account = await models.Admin.findOne({ "credential.email": email.toLowerCase() }).select("credential");
      if (!account) {
        return done(undefined, false, { message: `Email ${email} is not found.`, status_code: 400 });
      }
      account.comparePassword(password, account.credential.password, (err: Error, isMatch: boolean) => {
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
  adminPassport.use(new JwtStrategy(opts, (jwt_payload: any, done: any) => {
    models.Admin.findById(jwt_payload.admin_id, (err: any, user) => {
      if (err) {
        return done(err, false);
      }
      if (user) {
        return done(undefined, user);
      } else {
        return done(undefined, false);
        // or you could create a new account
      }
    }).select("JWT email");
  }));
  return {
    adminPassport,
    isJWTValid: (req: Request, res: Response, next: NextFunction): void => {
      adminPassport.authenticate("jwt", { session: false }, (err: any, admin: AdminModel) => {
        if (err) { return res.status(401).send({ "message": "Unauthenticated", detail: err }); }
        if (!admin) return res.status(401).send({ "message": "Unauthenticated" });
        res.locals = { admin };
        // req.locals = { admin };
        next();
      })(req, res, next);
      // }
      // );
    },
    isAuthorized: (req: Request, res: Response, next: NextFunction): void => {
      const provider = req.path.split("/").slice(-1)[0];

      if (_.find(req.user.tokens, { kind: provider })) {
        return next();
      } else {
        return next();
      }
    },
    isAuthenticated: (req: Request, res: Response, next: NextFunction): void => {
      if (req.isAuthenticated()) {
        return next();
      }
      return next();
    }
  };
}
