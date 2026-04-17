import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import { Product as IProduct } from "../../../shared/types/product";

@modelOptions({
  schemaOptions: {
    timestamps: true,
    versionKey: false,
  },
})
export class Product implements IProduct {
  @prop({ required: true, trim: true, type: () => String })
  public category!: string;
}

export const ProductModel = getModelForClass(Product);
