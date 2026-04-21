import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import { Product as IProduct } from "../../../shared/types/product";

@modelOptions({
  schemaOptions: {
    timestamps: true,
    versionKey: false,
  },
})
export class Product implements IProduct {
  @prop({ required: true, trim: true })
  public name!: string;

  @prop({ trim: true, unique: true, sparse: true })
  public barcode?: string;

  @prop({ required: true, trim: true })
  public category!: string;

  @prop({ required: true, min: 0 })
  public cost_price!: number;

  @prop({ required: true, min: 0 })
  public sell_price!: number;

  @prop({ required: true, min: 0, default: 0 })
  public stock!: number;

  @prop({ required: true, trim: true })
  public unit!: string;

  @prop()
  public expired_date?: Date;

  @prop({ default: true })
  public is_active!: boolean;
}

export const ProductModel = getModelForClass(Product);
