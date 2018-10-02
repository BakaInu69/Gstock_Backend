import * as bcrypt from "bcrypt-nodejs";
import * as crypto from "crypto";
import { Document, Error, Schema, SchemaTypes, Types } from "mongoose";
import * as mongoosePaginate from "mongoose-paginate";
import * as jwt from "jsonwebtoken";
import { ObjectID } from "bson";
const ALGORITHEM = "aes-256-ctr",
    PASSWORD = "f822cf455ccf249830cc5d530c9eb798",
    ALGORITHM_NONCE_SIZE = 16,
    NONCE = "749d081267d1dbb4";
export interface MerchantCommission {
  category_id: Types.ObjectId;
  rate: number;
}
export interface Store {
  name: string;
  description: string;
}
export interface Profile {
    profile_url: string;
    associate_to_website: string;
    DOB: Date;
    gender: string;
    prefix: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    suffix: string;
}
export interface UserModel extends Document {
  is_active: boolean;
  detail: {
    shop_title: string
  };
  credential: {
    fb_id: string;
    user_name: string;
    email: string;
    profile_pic: string;
    password: string;
    last_login: Date;
    password_reset_token: string;
    password_reset_expires: Date;
    user_group: string;
    email_verified: boolean;
    email_verif_token: string;
    email_verif_expires: Date;
  };
  profile: {
    profile_url: string,
    associate_to_website: string,
    DOB: Date,
    gender: string,
    prefix: string,
    first_name: string,
    middle_name: string,
    last_name: string,
    suffix: string,
  };
  contact: {
    email_for_contact: string,
    mobile_no: string,
    tel: number,
    fax: number,
    skype: string,
  };
  company: {
    company_name: string,
    person_charge: string,
    reg_no: string,
  };
  bank: {
    title: string,
    name: string,
    code: string,
    holder_name: string,
    account_no: string,
    merchant_status: string
  };
  location: {
    addressline1: string,
    addressline2: string,
    addressline3: string,
    country: string,
    state_province: string,
    postal_code: string
  };
  payment: {
    tax_number: string,
    vat_number: number,
    payment_info: string,
    default_billing_add: string
  };
  commission: [MerchantCommission];
  store: Store;
  comparePassword: (candidatePassword: string, password: string, cb: (err: any, isMatch: any) => void) => void;
  gravatar: (size: number) => string;
  isEmailExist: (email: string) => boolean;
  isStoreNameExist: (storeName: string) => boolean;
  createUser: (user: {}) => UserModel;
  getMerchant: (merchantId: Types.ObjectId) => UserModel;
  canResetPassword: (token: string) => boolean;
  updatePassword: (newPassword: string) => UserModel;
  findUserCredentialByEmail: (email: string) => UserModel;
  updateForgetPasswordToken: () => Promise<string>;
  clearForgetPasswordToken: () => void;
  isResetPasswordTokenValid: (passwordResetToken: string) => boolean;
  parseForgetPasswordToken: (token: string) => any;
  generateToken: () => {email: string, token: string};
  hide: string;
}
const credentialSchema = new Schema({
  fb_id: String,
  user_name: String,
  email: {
    type: String,
    unique: true
  },
  password: {
    type: String,
    select: false
  }, //
  user_group: String,
  last_login: Date,
  password_reset_token: String,
  password_reset_expires: Date,
  email_verified: Boolean,
  email_verif_token: String,
  email_verif_expires: Date,
});
const userSchema = new Schema({
  is_active: {
    type: Boolean,
    default: true
  },
  detail: {
    shop_title: String
  },
  credential: {
    select: false,
    type: credentialSchema
  },

  profile: {
    profile_pic_url: String,
    associate_to_website: String,
    DOB: Date,
    gender: {
      type: String,
      default: ["Male"],
      enum: {
        values: ["Male", "Female"],
        message: "Unknown gender"
      }
    },
    prefix: String,
    first_name: String,
    middle_name: String,
    last_name: String,
    suffix: String,
  },
  contact: {
    skype: String,
    email_for_contact: String,
    mobile_no: String,
    tel: Number,
    fax: Number
  },
  company: {
    company_name: String,
    person_charge: String,
    reg_no: String,
  },
  bank: {
    code: String,
    title: String,
    name: String,
    holder_name: String,
    account_no: String,
  },
  location: {
    addressline1: String,
    addressline2: String,
    addressline3: String,
    country: String,
    state_province: String,
    postal_code: String
  },
  payment: {
    category_commission: String,
    tax_number: String,
    vat_number: Number,
    payment_info: String,
    default_billing_add: String
  },
  store: {
    name: String,
    description: String
  },
  commission: [{
    category_id: SchemaTypes.ObjectId,
    rate: Number
  }]
}, {
    timestamps: true,
    minimize: false
  });

/**
 * Password hash middleware.
 */

userSchema.pre("save", function save(next) {
  const user: UserModel = this;
  if (!(<any>user).isModified("credential.password")) {
    return next();
  }
    bcrypt.genSalt(10, (err, salt) => {
      if (err) { return next(err); }
      bcrypt.hash(user.credential.password, salt, undefined, (err: Error, hash) => {
        if (err) { return next(err); }
        user.credential.password = hash;
        next();
      });
    });
});
userSchema.pre("save", function save(next) {
  const user: UserModel = this;
  if (!user.credential.password_reset_token || !(<any>user).isModified("credential.password_reset_token")) {
    return next();
  }
  user.credential.password_reset_token = generatePasswordResetToken(user.credential.password_reset_token);
  next();
});
function generatePasswordResetToken(text: string): string {
    const cipher = crypto.createCipheriv(ALGORITHEM, PASSWORD, NONCE);
    let crypted = cipher.update(text, "utf8", "hex");
    crypted += cipher.final("hex");
    return crypted;
}
/**
 * Helper method for getting user's gravatar.
 */

userSchema.methods.gravatar = function (size: number) {
  if (!size) {
    size = 200;
  }
  if (!this.email) {
    return `https://gravatar.com/avatar/?s=${size}&d=retro`;
  }
  const md5 = crypto.createHash("md5").update(this.email).digest("hex");
  return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

/**
 * Compare password
 */
userSchema.methods.comparePassword = function (candidatePassword: string, password: string, cb: (err: Error, isMatch: boolean) => {}) {
  bcrypt.compare(candidatePassword, password, function (err: Error, isMatch: boolean) {
    cb(err, isMatch);
  });
};

userSchema.methods.canResetPassword = function (token: string) {
  return this.credential.password_reset_token === token;
};
// userSchema.statics.isEmailVerified = async function (storeName: string) {
//   return await this.findOne({ "store.name": storeName }).lean() ? true : false;
// };
userSchema.methods.updatePassword = async function (newPassword: string) {
  const user: UserModel = this;
  user.credential.password = newPassword;
  return await (<any>user).save();
};

userSchema.methods.updateForgetPasswordToken = async function (): Promise<string> {
  const DAY = 24 * 60 * 60 * 1000;
  const user: UserModel = this;
  user.credential.password_reset_expires = new Date(Date.now() + 1 * DAY);
  console.log(new Date(Date.now() + 1 * DAY));
  user.credential.password_reset_token = JSON.stringify({
    "email": user.credential.email,
    "user_id": (<any>user).id,
    "expires": Date.now() + 1 * DAY
  });
  const newUser = await (<any>user).save();
  return newUser.credential.password_reset_token;
};

userSchema.statics.parseForgetPasswordToken =  function (token: string) {
  const decipher = crypto.createDecipheriv(ALGORITHEM, PASSWORD, NONCE);
  let dec = decipher.update(token , "hex", "utf8");
  dec += decipher.final("utf8");
  return dec;
};
userSchema.methods.clearForgetPasswordToken = async function () {
  const user: UserModel = this;
  user.credential.password_reset_token = "";
  user.credential.password_reset_expires = null;
  await (<any>user).save();
};
userSchema.methods.generateToken =  function() {
  const user: any = this;
  const {
    id,
    credential: {
      email, user_group
    } } = user;
  // send token only on registration
  const payload = {
      id,
      user_group,
      timestamp: new Date(),
      expired: 900
  };
  const token = jwt.sign(payload, process.env.JWTKEY);
  return ({
      token,
      email
  });
};
userSchema.statics.findUserCredentialById = async function (userId: string) {
  return await this.findById(userId).select("credential").lean();
};
userSchema.statics.findUserCredentialByEmail = async function (email: string) {
  return await this.findOne({ "credential.email": email }).select("credential");
};

userSchema.statics.isResetPasswordTokenValid = async function (passwordResetToken: string, passwordResetExpires: Date) {
  return await this.findOne({
    "credential.password_reset_token": passwordResetToken,
    "credential.password_reset_expires": {$gte: new Date()}
  }).lean() ? true : false;
};

userSchema.statics.isEmailTokenValid = async function (passwordResetToken: string, emailVerifExpires: Date) {
  return await this.findOne({
    "credential.email_verif_token": passwordResetToken,
    "credential.email_verif_expires": emailVerifExpires
  }).lean() ? true : false;
};

userSchema.statics.isEmailExist  = async function(email: string) {
  try {
    if (await this.findOne({ "credential.email": email }).lean()) {
      throw({
        error: "Email has been taken",
        status_code: 409,
        detail_code: "100000"
      });
    }
    return true;
  } catch (error) {
    throw(error);
  }
};

userSchema.statics.isStoreNameExist = async function (storeName: string) {
  const exisitingStoreName = await this.findOne({ "store.name": storeName }).lean();
  return  exisitingStoreName ? true : false;
};

userSchema.statics.createUser = async function (user: {}) {
  try {
    return await new this(user).save();
  } catch (error) {
    throw({
      error,
      status_code: 500,
      detail_code: "error"
    });
  }
};

userSchema.statics.getMerchant = async function (merchantId: Types.ObjectId) {
  try {
    if (!Types.ObjectId.isValid(merchantId)) {
      throw({
        error: "Invalid object ID",
        status_code: 400,
        detail_code: "100001"
      });
    }
    return await this.findOne(
      {
        _id: new ObjectID(merchantId),
        "credential.user_group": "merchant"
      });
  } catch (error) {
    throw({
      error,
      status_code: 500,
      detail_code: "error"
    });
  }
};
userSchema.statics.getMerchantOrError = async function (merchantId: Types.ObjectId) {
  try {
    if (!Types.ObjectId.isValid(merchantId)) {
      throw({
        error: "Invalid object ID",
        status_code: 400,
        detail_code: "100001"
      });
    }
    const merchant = await this.findOne(
      {
        _id: new ObjectID(merchantId),
        "credential.user_group": "merchant"
      }).select("store createdAt");
      if (!merchant) throw({
        error: "No such merchant",
        status_code: 404,
        detail_code: "100000"
      });
      return merchant;
  } catch (error) {
    console.log(error);
    throw(error);
  }
};

userSchema.virtual("hide")
  .get(function () { return this; })
  .set(function (field) {
    this[field] = {};
    // console.log("Calling virtual and deleting credential", this);
  });
userSchema.plugin(mongoosePaginate);
export default userSchema;