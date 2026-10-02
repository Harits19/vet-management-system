import { useVetQuery } from "@/hooks/useVetQuery";

export interface UserRecord {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: "superadmin" | "cashier" | "doctor";
  isActive: boolean;
  doctorSignature?: string;
  createdAt: string;
}

export interface GetUsersResponse {
  data: UserRecord[];
  meta: { total: number };
}

export function useGetUsers(params: {
  page: number;
  limit: number;
  search: string;
}) {
  return useVetQuery<GetUsersResponse>({
    url: "/api/users",
    params,
    method: "GET",
  });
}
