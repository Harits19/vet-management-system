import useFetch from "@/hooks/useFetch";
import { IScrape } from "../../shared/types/scrape.type";
import { ISale, SalesFilter } from "../../shared/types/sale.type";
import { ApiResponse } from "../../shared/types/api";

export function useSyncSales() {
  return useFetch<unknown, IScrape>({
    method: "POST",
    path: "/api/sales/sync",
    showSuccessResponse: true,
  });
}

export function useGetSales(pagination: SalesFilter) {
  return useFetch<ApiResponse<ISale[]>>({
    method: "GET",
    path: "/api/sales",
    runOnInit: true,
    params: pagination,
  });
}
