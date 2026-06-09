import useFetch from "@/hooks/useFetch";

import { ApiResponse } from "../../shared/types/api";
import { ICustomer, ICustomerListFilter } from "../../shared/types/customer.type";


export function useGetCustomers(pagination: ICustomerListFilter) {
  return useFetch<ApiResponse<ICustomer[]>>({
    method: "GET",
    path: "/api/customer",
    runOnInit: true,
    params: pagination,
  });
}
