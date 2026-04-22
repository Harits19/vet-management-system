import { z } from "zod";
import { paginationQuerySchema } from "./pagination";

export interface IProduct {
  name: string;
  barcode?: string;
  category: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  unit: string;
  expiredDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductsFilter {
  category: "";
  sortBy: "createdAt";
  order: "desc" | "asc";
}

export const productsFilterSchema = paginationQuerySchema.extend({
  category: z.string().optional(),
  is_active: z.coerce.boolean().optional(),

  sortBy: z
    .enum(["name", "sellPrice", "stock", "createdAt"])
    .default("createdAt"),

  order: z.enum(["asc", "desc"]).default("desc"),
});
