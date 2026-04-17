import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";

@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
})
export class User {
  @prop({ type: () => String, required: true, trim: true })
  public name!: string;

  @prop({
    type: () => String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  public email!: string;

  @prop({ type: () => String, required: true })
  public passwordHash!: string;

  @prop({
    type: () => String,
    required: true,
    enum: ["admin", "staff"],
    default: "staff",
  })
  public role!: "admin" | "staff";
}

export const UserDB = getModelForClass(User);
