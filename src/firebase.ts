import * as admin from "./../node_modules/firebase-admin/lib/index";
// const admin = require("firebase-admin");
const serviceAccount = require("./../gstock-6dab8-firebase-adminsdk-ql4io-4840376e3f.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://gstock-6dab8.firebaseio.com"
});
export const db = admin.database();
