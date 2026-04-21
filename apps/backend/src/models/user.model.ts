import mongoose, { Schema, Document } from "mongoose";

export enum UserRole {
  SUPERADMIN = "superadmin",
  ADMIN = "admin",
  DOCTOR = "doctor",
  CASHIER = "cashier",
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.ADMIN,
    },

    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const UserModel = mongoose.model<IUser>("User", UserSchema);
