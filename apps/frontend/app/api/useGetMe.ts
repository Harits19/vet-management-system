import { useVetQuery } from "@/hooks/useVetQuery";
import { UserRole } from "@vet/shared";

export interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  doctorSignature?: string;
}

export interface GetMeResponse {
  data: User;
}

export function useGetMe() {
  return useVetQuery<GetMeResponse>({
    url: "/api/auth/me",
  });
}
