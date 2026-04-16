import mongoose, { InferSchemaType, Model } from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
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
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "staff"],
      default: "staff",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.methods.verifyPassword = function verifyPassword(password: string) {
  return bcrypt.compare(password, this.passwordHash);
};

type UserDocument = InferSchemaType<typeof userSchema> & {
  verifyPassword(password: string): Promise<boolean>;
};

export type UserModel = Model<UserDocument>;

export const User =
  (mongoose.models.User as UserModel | undefined) ||
  mongoose.model<UserDocument>("User", userSchema);
