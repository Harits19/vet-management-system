import { useVetQuery } from "@/hooks/useVetQuery";

export interface LetterRow {
  _id: string;
  letterType: string;
  letterNumber: string;
  date: string;
  petId: { _id: string; name: string; kind?: string };
  customerId: { _id: string; name: string };
  doctorId: { _id: string; name: string };
  ownerSignature?: string;
  subject?: string;
}

export interface GetLettersResponse {
  data: LetterRow[];
  meta: { total: number };
}

export function useGetLetters(params: {
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  order: string;
  letterType?: string;
}) {
  return useVetQuery<GetLettersResponse>({
    url: "/api/letters",
    params,
    method: "GET",
  });
}
