import { z } from "zod";
import { paginationQuerySchema } from "./pagination";

const numberField = z.coerce.number();

export const productSchema = z.object({
  category: z.string(),
  product: z.object({
    code: z.string().optional().nullable(),
    name: z.string(),
    weight: numberField.optional(), // Berat
  }),
  pricing: z.object({
    cost: numberField, // Harga Pokok
    selling: numberField, // Harga Jual
  }),
  inventory: z.object({
    quantity: numberField, // Stok Jumlah
  }),
  unit: z.string().optional().nullable(),
});

export const productCreateRequestSchema = productSchema;

export interface ProductCreateRequest extends z.infer<
  typeof productCreateRequestSchema
> {}

export type IProduct = z.infer<typeof productCreateRequestSchema> & {
  createdAt: Date;
  updatedAt: Date;
};

export const productsFilterSchema = paginationQuerySchema.extend({
  category: z.string().optional(),
  is_active: z.coerce.boolean().optional(),

  sortBy: z
    .enum(["name", "sellPrice", "stock", "createdAt"])
    .default("createdAt"),

  order: z.enum(["asc", "desc"]).default("desc"),
});

export interface ProductFilter extends z.infer<typeof productsFilterSchema> {}
