import { useVetQuery } from "@/hooks/useVetQuery";

export interface MHRecord {
  _id: string;
  petId: { _id: string; name: string; kind: string };
  visitDate: string;
  diagnosis: string;
  doctorId: { _id: string; name: string };
  treatments: any[];
  prescriptions: any[];
  createdAt: string;
}

export interface GetMedicalHistoriesResponse {
  data: MHRecord[];
  meta: { total: number };
}

export function useGetMedicalHistories(params: {
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  order: string;
}) {
  return useVetQuery<GetMedicalHistoriesResponse>({
    url: "/api/medical-histories",
    params,
    method: "GET",
  });
}
