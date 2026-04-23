import { z } from "zod";
import { paginationQuerySchema } from "./pagination";

export const productCreateRequestSchema = z.object({
  name: z.string(),
  barcode: z.string().optional(),
  category: z.string(),
  costPrice: z.number(),
  sellPrice: z.number(),
  stock: z.number(),
  unit: z.string(),
  expiredDate: z.coerce.date().optional(),
  isActive: z.boolean(),
});

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
