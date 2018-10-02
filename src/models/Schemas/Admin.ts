import * as bcrypt from "bcrypt-nodejs";
import * as crypto from "crypto";
import { Schema, Error, Document } from "mongoose";
export interface AdminModel extends Document {
    credential: {
        email: string;
        password: string;
        confirmPassword: string;
        token: string;
    };
    contact: {
        emailForContact: string,
        tel: number,
        fax: number,
    };
    comparePassword: (candidatePassword: string, password: string, cb: (err: any, isMatch: any) => void) => void;
}

const adminSchema = new Schema({
    credential: {
        email: String,
        password: String,
        token: String
    },

    contact: {
        emailForContact: String,
        tel: Number,
        fax: Number,
    },
    lastLogin: Date,
});
adminSchema.pre("save", function save(next) {
    const admin = this;
    if (!admin.isModified("ential.password")) { return next(); }
    bcrypt.genSalt(10, (err, salt) => {
        if (err) { return next(err); }
        bcrypt.hash(admin.credential.password, salt, undefined, (err: Error, hash) => {
            if (err) { return next(err); }
            admin.credential.password = hash;
            next();
        });
    });
});

adminSchema.methods.comparePassword = function (candidatePassword: string, password: string, cb: (err: Error, isMatch: boolean) => {}) {
    bcrypt.compare(candidatePassword, password, (err, isMatch) => {
        cb(err, isMatch);
    });
};
export default adminSchema;
