import { ProductsResponse } from "@/shared/types";
import useFetch from "../useFetch";

export default function useGetProducts() {
  return useFetch<ProductsResponse>({ path: "/api/products" });
}
