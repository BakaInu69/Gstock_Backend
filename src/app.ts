import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as dotenv from "dotenv";
import * as express from "express";
import { NextFunction, Request, Response } from "express";
import * as expressValidator from "express-validator";
import * as morgan from "morgan";
import * as passport from "passport";
import Models from "./models/Roles";
import Routes from "./routes";
/**
 * Routes
 */
import { DatabaseConnection } from "./database";
import { logger } from "./logger";

const fs = require("fs");

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: ".env" });
import { UserPassportClass } from "./config/user.passport";
import { getAdminPassport, } from "./config/admin.passport";

export class GApp {
    config;
    constructor(private role: "admin" | "buyer" | "merchant", private port: number) {
    }
    async getDB() {
        return await new DatabaseConnection(this.role).connect();
        // return await dbConnect(this.role);
    }
    async getModels() {
        return await Models[this.role](await this.getDB());
        // return await new Models(this.role, await this.getDB()).models();
        // return await getModels(await this.getDB());
    }
    async createApp() {
        const app = express();
        app.use(cors());
        app.options("*", cors());
        /**
         * Express configuration.
         */
        app.set("port", this.port);

        // log only 4xx and 5xx responses to console
        app.use(morgan("dev"));
        // app.use(morgan("common", {
        //     stream: fs.createWriteStream("./log/morgan/access.log", { flags: "a" })
        // }));

        // app.use(morgan("common", {
        //     skip: (req, res) => res.statusCode < 400,
        //     stream: fs.createWriteStream("./log/morgan/access_error.log", { flags: "a" })
        // }));

        app.use(bodyParser.json({ limit: "50mb" }));
        app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
        app.use(expressValidator());
        app.use(passport.initialize());

        app.get("/", (req: Request, res: Response, next: any) => res.status(200).json({
            message: `Welcome! You are connecting as a ${this.role}.`,
            quote: "Understand your tool well before you wield it. If it does not feel right, you are probably not using it right.",
            headers: req.headers
        }));
        const models = await this.getModels();
        /**
         * API keys and Passport configuration.
         */
        const userPassport = new UserPassportClass(models);
        const adminPassport = getAdminPassport(models);

        const config: any = {
            models,
            role: this.role,
            passport: {
                userPassport,
                adminPassport
            }
        };
        /**
         * Authentication middleware.
         */
        app.get("/auth", userPassport.isJWTValid.bind(userPassport), (req: Request, res: Response, next: any) => res.status(200).send({ message: "Authentication successful." }));
        app.get("/admin/auth", adminPassport.isJWTValid, (req: Request, res: Response, next: any) => res.status(200).send({ message: "Authentication successful." }));
        const api = Routes(this.role)(app, config);
        // api.registerRoutes()(app, config);
        // const api = new API(app, config);
        /**
         * Error Handler.
         */

        app.use((err: Error, req: Request, res: Response, next: any) => {
            if (process.env.NODE_ENV === "development") {
                console.log(err.stack || err.message);
            }
            logger.log({
                level: "error",
                originalUrl: req.originalUrl,
                message: err.stack || err.message
            });
            console.log(err.stack || err.message);
            res.status(500).send(
                {
                    message: "Unknown error",
                    error: "Unknown error"
                }
            );
        });
        return app;
    }
    async serve() {
        const app  = await this.createApp();
        return app.listen(app.get("port"), () => {
            console.log(("  %s is running at http://localhost:%d in %s mode"), this.role, app.get("port"), app.get("env"));
            console.log("  Press CTRL-C to stop\n");
        });
    }
}