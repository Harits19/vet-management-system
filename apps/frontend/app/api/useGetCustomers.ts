import { useVetQuery } from "@/hooks/useVetQuery";

export interface Customer {
  _id: string;
  name: string;
  whatsapp?: string;
  address?: string;
  province?: string;
  regency?: string;
  district?: string;
  village?: string;
  hamlet?: string;
  createdAt: string;
}

export interface GetCustomersResponse {
  data: Customer[];
  meta: { total: number };
}

export function useGetCustomers(params: {
  page: number;
  search: string;
  sortBy: string;
  order: string;
  limit: number;
}) {
  return useVetQuery<GetCustomersResponse>({
    url: "/api/customers",
    params,
    method: "GET",
  });
}
