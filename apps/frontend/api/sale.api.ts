import useFetch from "@/hooks/useFetch";
import { IScrape } from "../../shared/types/scrape.type";
import { ISale, SalesFilter, SyncRequest } from "../../shared/types/sale.type";
import { ApiResponse } from "../../shared/types/api";

export function useSyncSales({ syncLatestOnly }: SyncRequest) {
  return useFetch<undefined, SyncRequest>({
    method: "POST",
    path: "/api/sales/sync",
    showSuccessResponse: true,
    body: { syncLatestOnly },
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
