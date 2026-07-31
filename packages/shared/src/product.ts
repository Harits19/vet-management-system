import { z } from "zod";
import { stringRequired, numberFromString, numberOptional } from "./common.js";

// ──────────────────────────────────────────
// Product (Barang) — collection terpisah dari Jasa (Service)
// productType: "medicine" (obat) | "good" (barang non-obat)
// ──────────────────────────────────────────
export const productTypeEnum = z.enum(["medicine", "good"] as const);
export type ProductType = z.infer<typeof productTypeEnum>;

export interface IProduct {
  _id: string;
  productType: ProductType;
  category: string;
  product: {
    code?: string;
    name: string;
    weight?: number;
  };
  pricing: {
    cost?: number;
    selling: number;
    online?: number;
  };
  inventory: {
    quantity?: number;
  };
  unit?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSubSchema = z.object({
  code: z.string().optional(),
  name: stringRequired,
  weight: numberOptional,
});

const pricingSubSchema = z.object({
  cost: numberOptional,
  selling: numberFromString,
  online: numberOptional,
});

const inventorySubSchema = z.object({
  quantity: numberOptional,
});

export const productCreateSchema = z.object({
  productType: productTypeEnum.default("good"),
  category: stringRequired,
  product: productSubSchema,
  pricing: pricingSubSchema,
  inventory: inventorySubSchema.default({}),
  unit: z.string().optional(),
});
export type ProductCreateRequest = z.infer<typeof productCreateSchema>;

export const productUpdateSchema = productCreateSchema.partial();
export type ProductUpdateRequest = z.infer<typeof productUpdateSchema>;

export const productFilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().default(""),
  productType: productTypeEnum.optional(),
  category: z.string().optional(),
  sortBy: z.enum(["product.name", "pricing.selling", "inventory.quantity", "createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type ProductFilter = z.infer<typeof productFilterSchema>;
