import { ApiResponse } from "../../shared/types/api";
import {
  IProduct,
  ProductCreateRequest,
  ProductFilter,
} from "../../shared/types/product.type";
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

export function useImportProducts() {
  const { mutate: mutateBase, loading } = useFetch<unknown, FormData>({
    method: "POST",
    path: "/api/products/import",
    showResponse: true,
  });

  const mutate = ({
    body,
    onSuccess,
  }: {
    body: File;
    onSuccess?: () => void;
  }) => {
    const formData = new FormData();
    formData.append("file", body);
    mutateBase({ body: formData, onSuccess });
  };

  return {
    mutate,
    loading,
  };
}
