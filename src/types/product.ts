import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import { z } from "zod";
import { ApiSuccess } from "./api";

export class Price {
  @prop({ type: () => Number, required: true })
  public sale!: number;

  @prop({ type: () => Number, required: true })
  public online!: number;

  @prop({ type: () => Number, required: true })
  public cost!: number;
}

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

  @prop({ type: () => Price, _id: false, required: true })
  public price!: Price;

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
    price: z.object({
      cost: z.coerce.number().min(1),
      sale: z.coerce.number(),
      online: z.coerce.number(),
    }),
    isVisible: z.coerce.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.price.sale < data.price.cost) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selling price must be >= cost price",
        path: ["sellingPrice"],
      });
    }

    if (data.price.online < 1 || data.price.online > data.price.sale) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Online price must be between 1 and selling price",
        path: ["onlinePrice"],
      });
    }
  }) satisfies z.ZodType<Product>;
