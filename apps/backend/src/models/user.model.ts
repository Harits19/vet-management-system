import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";

export enum UserRole {
  SUPERADMIN = "superadmin",
  ADMIN = "admin",
  DOCTOR = "doctor",
  CASHIER = "cashier",
}

@modelOptions({
  schemaOptions: {
    timestamps: true,
    versionKey: false,
  },
})
export class User {
  @prop({ required: true, trim: true })
  public name!: string;

  @prop({ required: true, unique: true, lowercase: true })
  public email!: string;

  @prop({ required: true })
  public password!: string;

  @prop({ enum: UserRole, default: UserRole.ADMIN })
  public role!: UserRole;

  @prop({ default: true })
  public is_active!: boolean;
}

export const UserModel = getModelForClass(User);