import mongoose, { Document, Schema } from "mongoose";
import { ICookie } from "../../../shared/types/auth.type";



export interface Cookie extends ICookie, Document {
    createdAt: Date;
    updatedAt: Date;
    key: string
}

const CookieSchema = new Schema<Cookie>({
    key: {
        type: String,
        unique: true
    },
    cookie: {
        type: String,
        required: true,
        trim: true
    }
})

export const CookieModel = mongoose.model("Cookie", CookieSchema);