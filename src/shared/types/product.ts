import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import { z } from "zod";
import { ApiSuccess } from "./api";

@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
})
export class Product {
  @prop({ type: () => String, required: true, trim: true })
  public category!: string;

  @prop({ type: () => String, required: true, trim: true, uppercase: true })
  public code!: string;

  @prop({ type: () => String, required: true, trim: true })
  public name!: string;

  @prop({ type: () => String })
  public description?: string;

  @prop({ type: () => Number, default: 0 })
  public stock!: number;

  @prop({ type: () => Number, required: true })
  public costPrice!: number;

  @prop({ type: () => Number, required: true })
  public sellingPrice!: number;

  @prop({ type: () => Number, default: 0 })
  public onlinePrice!: number;

  @prop({ type: () => Boolean, default: true })
  public isVisible!: boolean;
}

// model
export const ProductDB = getModelForClass(Product);

export interface ProductRequest extends Omit<Product, "id" | "createdAt"> {}

export type ProductsResponse = ApiSuccess<Product[]>;
export type ProductResponse = ApiSuccess<Product>;

export const createProductSchema = z
  .object({
    category: z
      .string()
      .min(1)
      .transform((v) => v.trim()),
    code: z
      .string()
      .min(1)
      .transform((v) => v.trim().toUpperCase()),
    name: z
      .string()
      .min(1)
      .transform((v) => v.trim()),
    description: z.string().optional(),

    stock: z.coerce.number().min(0),
    costPrice: z.coerce.number().min(1),
    sellingPrice: z.coerce.number(),
    onlinePrice: z.coerce.number(),
    isVisible: z.coerce.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.sellingPrice < data.costPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selling price must be >= cost price",
        path: ["sellingPrice"],
      });
    }

    if (data.onlinePrice < 1 || data.onlinePrice > data.sellingPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Online price must be between 1 and selling price",
        path: ["onlinePrice"],
      });
    }
  });
