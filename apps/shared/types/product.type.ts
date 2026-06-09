import { z } from "zod";
import { paginationQuerySchema } from "./pagination";
import { numberOptional, numberRequired, stringRequired } from "./zod";

export const productSchema = z.object({

  category: stringRequired,
  product: z.object({
    code: z.string().optional(),
    name: stringRequired,
    weight: numberOptional,
  }),
  pricing: z.object({
    cost: numberRequired,
    selling: numberRequired,
    online: numberOptional,
  }),
  inventory: z.object({
    quantity: numberRequired,
  }),
  unit: z.string().optional(),
});

export type ProductCreateRequest = z.infer<typeof productSchema>;

export type IProduct = z.infer<typeof productSchema> & {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * @deprecated 
 */
export const productsFilterSchema = paginationQuerySchema.extend({
  search: z.string(),
  category: z.string().optional(),
  sortBy: z
    .enum([
      "product.name",
      "pricing.selling",
      "inventory.quantity",
      "createdAt",
    ])
    .default("createdAt"),

  order: z.enum(["asc", "desc"]).default("desc"),
});

export interface ProductFilter extends z.infer<typeof productsFilterSchema> {}
