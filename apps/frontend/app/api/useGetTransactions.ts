import { useVetQuery } from "@/hooks/useVetQuery";

export interface Transaction {
  _id: string;
  type: "shop" | "vet";
  receiptNumber: string;
  timestamp: string;
  customer?: { _id: string; name: string };
  pet?: { _id: string; name: string; kind: string };
  cashier: { _id: string; name: string };
  summary: { total: number; paid: number };
  paymentStatus: string;
  paymentMethod: string;
  items: any[];
}

export interface GetTransactionsResponse {
  data: Transaction[];
  meta: { total: number };
}

export function useGetTransactions(params: {
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  order: string;
  type?: string;
}) {
  return useVetQuery<GetTransactionsResponse>({
    url: "/api/transactions",
    params,
    method: "GET",
  });
}
