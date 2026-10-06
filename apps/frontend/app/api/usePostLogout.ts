import { useVetMutation } from "@/hooks/useVetQuery";



export function usePostLogout() {
  return useVetMutation<void, void>({
    url: "/api/auth/logout",
    options: {
      method: "POST",
    },
  });
}
