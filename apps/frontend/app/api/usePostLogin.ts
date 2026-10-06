import { useVetMutation } from "@/hooks/useVetQuery";
import { AuthLoginResponse } from "@vet/shared";

export interface PostLoginRequest {
  username: string;
  password: string;
}

export interface PostLoginResponse {
  data: AuthLoginResponse;
}

export function usePostLogin() {
  return useVetMutation<PostLoginResponse, PostLoginRequest>({
    url: "/api/auth/login",
    options: {
      method: "POST",
    },
  });
}
