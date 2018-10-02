import { Types } from "mongoose";

export function toArrayOfObjectId(toBeConverted: Array<string>) {
    return toBeConverted.map(c => Types.ObjectId(c));
}