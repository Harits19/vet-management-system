import { ApiResponse } from "../../shared/types/api";
import { GeneralFilter } from "../../shared/types/pagination";
import { IProduct } from "../../shared/types/product";
import useFetch from "../hooks/useFetch";

export default function useGetProducts(pagination: GeneralFilter) {
  return useFetch<ApiResponse<IProduct[]>>({
    method: "GET",
    path: "/api/products",
    runOnInit: true,
    params: pagination,
  });
}
