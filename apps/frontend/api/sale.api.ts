import useFetch from "@/hooks/useFetch";
import { IVetSale, IVetSaleCreate, VetSaleCreateFormRequest, VetSaleFilter } from "../../shared/types/vet.sale.type";
import { ApiResponse } from "../../shared/types/api";
import { SyncRequest } from "../../shared/types/sale.type";

export function useSyncSales({ syncLatestOnly }: SyncRequest) {
  return useFetch<undefined, SyncRequest>({
    method: "POST",
    path: "/api/sales/sync",
    showSuccessResponse: true,
    body: { syncLatestOnly },
  });
}

export function useGetSales(pagination: VetSaleFilter) {
  return useFetch<ApiResponse<IVetSale[]>>({
    method: "GET",
    path: "/api/sales",
    runOnInit: true,
    params: pagination,
  });
}


export function usePostSale() {

  return useFetch<void, VetSaleCreateFormRequest>({
    method: 'POST',
    path: '/api/sales',

  })
}