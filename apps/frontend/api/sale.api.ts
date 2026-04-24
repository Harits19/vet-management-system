import useFetch from "@/hooks/useFetch";
import { IScrape } from "../../shared/types/scrape.type";

export function useSyncSales() {
  return useFetch<unknown, IScrape>({
    method: "POST",
    path: "/api/sales/sync",
    showSuccessResponse: true,
  });
}
