import { useVetQuery } from "@/hooks/useVetQuery";

export interface Product {
  _id: string;
  productType: "medicine" | "good";
  goodType?: "petshop" | "bmhp";
  category: string;
  subcategory?: string;
  product: { code?: string; name: string; weight?: number };
  pricing: { cost?: number; selling: number; online?: number };
  inventory: { quantity?: number };
  unit?: string;
  isActive: boolean;
}

export interface GetProductsResponse {
  data: Product[];
  meta: { total: number };
}

export function useGetProducts(params: {
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  order: string;
  productType?: string;
  goodType?: string;
}) {
  return useVetQuery<GetProductsResponse>({
    url: "/api/products",
    params,
    method: "GET",
  });
}
