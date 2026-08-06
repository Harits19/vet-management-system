import mongoose, { Schema } from "mongoose";
import { IUser, type UserRole } from "@vet/shared";

export const UserKey = "User";

export interface IUserDoc extends Omit<IUser, "_id" | "createdAt" | "updatedAt">, Document {
  doctorSignature?: string; // tanda tangan digital dokter (data URL PNG) — dipakai ulang saat menandatangani surat
}

const UserSchema = new Schema<IUserDoc>(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["superadmin", "admin", "cashier", "doctor"], default: "cashier" },
    isActive: { type: Boolean, default: true },
    doctorSignature: { type: String },
  },
  { timestamps: true, versionKey: false }
);

export const UserModel = mongoose.model<IUserDoc>(UserKey, UserSchema);
