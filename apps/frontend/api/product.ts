import { ApiResponse } from "../../shared/types/api";
import { IProduct } from "../../shared/types/product";
import useFetch from "../hooks/useFetch";

export default function useGetProducts() {
  return useFetch<ApiResponse<IProduct[]>>({
    method: "GET",
    path: "/api/products",
    runOnInit: true,
  });
}
