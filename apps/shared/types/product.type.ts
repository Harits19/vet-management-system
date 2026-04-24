import { z } from "zod";
import { paginationQuerySchema } from "./pagination";

export const stringRequired = z.string().trim().min(1, "Required");
const numberRequired = z.preprocess(
  (val) => {
    if (val === "" || val === null || val === undefined) {
      return undefined;
    }
    return Number(val);
  },
  z.number().min(0, "Minimal 0"),
);

const numberOptional = z.preprocess(
  (val) => {
    if (val === "" || val === null || val === undefined) {
      return undefined;
    }
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  },
  z.number().min(0).optional(), // 🔥 optional di sini
);
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
  createdAt: Date;
  updatedAt: Date;
};

export const productsFilterSchema = paginationQuerySchema.extend({
  search: z.string().optional(),
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
