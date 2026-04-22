import { ApiResponse } from "../../shared/types/api";
import { IProduct, ProductFilter } from "../../shared/types/product";
import useFetch from "../hooks/useFetch";

export function useGetProducts(pagination: ProductFilter) {
  return useFetch<ApiResponse<IProduct[]>>({
    method: "GET",
    path: "/api/products",
    runOnInit: true,
    params: pagination,
  });
}
