import { ApiResponse } from "../../shared/types/api";
import { Pagination } from "../../shared/types/pagination";
import { IProduct } from "../../shared/types/product";
import useFetch from "../hooks/useFetch";

export default function useGetProducts(pagination: Pagination) {
  return useFetch<ApiResponse<IProduct[]>>({
    method: "GET",
    path: "/api/products",
    runOnInit: true,
    params: pagination,
  });
}
