import { useVetQuery } from "@/hooks/useVetQuery";

export interface Service {
  _id: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  isActive: boolean;
}

export interface GetServicesResponse {
  data: Service[];
  meta: { total: number };
}

export function useGetServices(params: {
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  order: string;
}) {
  return useVetQuery<GetServicesResponse>({
    url: "/api/services",
    params,
    method: "GET",
  });
}
