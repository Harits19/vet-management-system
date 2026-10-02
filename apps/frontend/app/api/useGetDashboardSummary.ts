import { useVetQuery } from "@/hooks/useVetQuery";

export interface LowStockItem {
  _id: string;
  productType: "medicine" | "good";
  category: string;
  product: { name: string };
  inventory: { quantity?: number };
  pricing: { selling: number };
  unit?: string;
}

export interface DashboardData {
  today: { total: number; count: number };
  week: { total: number; count: number };
  month: { total: number; count: number };
  patients: { year: number; month: number; day: number };
  lowStock: { medicine: LowStockItem[]; petshop: LowStockItem[]; consumable: LowStockItem[] };
  diagnoses: { data: { name: string; count: number }[]; total: number };
  customers: {
    data: { _id: string; name: string; whatsapp?: string; petCount: number; visitCount: number }[];
    total: number;
  };
}

export interface GetDashboardSummaryResponse {
  data: DashboardData;
}

export function useGetDashboardSummary(params: {
  diagnosesPage: number;
  customersPage: number;
  patientsYear: string;
  patientsMonth: string;
  patientsDate: string;
}) {
  return useVetQuery<GetDashboardSummaryResponse>({
    url: "/api/dashboard/summary",
    params,
    method: "GET",
  });
}
