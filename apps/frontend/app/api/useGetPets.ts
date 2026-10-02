import { useVetQuery } from "@/hooks/useVetQuery";

export interface Pet {
  _id: string;
  code?: string;
  name: string;
  kind: string;
  breed?: string;
  furColor?: string;
  gender: "male" | "female";
  birthDate?: string;
  initialAge?: { value: number; unit: "month" | "year" };
  notes?: string;
  customerId: { _id: string; name: string; whatsapp?: string };
  createdAt: string;
}

export interface GetPetsResponse {
  data: Pet[];
  meta: { total: number };
}

export function useGetPets(params: {
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  order: string;
}) {
  return useVetQuery<GetPetsResponse>({
    url: "/api/pets",
    params,
    method: "GET",
  });
}
