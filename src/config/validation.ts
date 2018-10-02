
import { check, query } from "express-validator/check";
export const validatePageAndLimit = [
    query("page", "Page number invalid.").isInt({ gt: 0 }),
    query("limit", "Limit number invalid.").isInt({ gt: 0, lt: 50 }),
    query("select", "Must select fields to return.").exists()
];