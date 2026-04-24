import { ApiResponse } from "../../shared/types/api";
import { IProduct, ProductCreateRequest, ProductFilter } from "../../shared/types/product.type";
import useFetch from "../hooks/useFetch";

export function useGetProducts(pagination: ProductFilter) {
  return useFetch<ApiResponse<IProduct[]>>({
    method: "GET",
    path: "/api/products",
    runOnInit: true,
    params: pagination,
  });
}


export function usePostProduct() {
  return useFetch<unknown, ProductCreateRequest>({
    method: "POST",
    path: "/api/products",
  });
}
