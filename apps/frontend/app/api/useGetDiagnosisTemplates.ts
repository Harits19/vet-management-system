import { useVetQuery } from "@/hooks/useVetQuery";

export interface TplLine {
  productId: string;
  name: string;
  quantity: number;
  dosage?: string;
  _key: string;
}

export interface DiagnosisTemplate {
  _id: string;
  name: string;
  items: {
    treatments: Omit<TplLine, "_key">[];
    prescriptions: Omit<TplLine, "_key">[];
    goods: Omit<TplLine, "_key">[];
  };
}

export interface GetDiagnosisTemplatesResponse {
  data: DiagnosisTemplate[];
  meta: { total: number };
}

export function useGetDiagnosisTemplates(params: {
  page: number;
  limit: number;
  search: string;
}) {
  return useVetQuery<GetDiagnosisTemplatesResponse>({
    url: "/api/diagnosis-templates",
    params,
    method: "GET",
  });
}
