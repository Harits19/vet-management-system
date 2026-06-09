import mongoose, { Schema, Document } from "mongoose";
export enum UserRole {
  SUPERADMIN = "superadmin",
  ADMIN = "admin",
  DOCTOR = "doctor",
  CASHIER = "cashier",
}


export const UserKey = 'User';


export interface User extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
  username: string;
}

const UserSchema = new Schema<User>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,

    },
    email: {
      type: String,
      required: true,
      unique: false,
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

export const UserModel = mongoose.model<User>(UserKey, UserSchema);
