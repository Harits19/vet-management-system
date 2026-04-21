import useFetch from "../useFetch";

export default function usePostLogout() {
  return useFetch({ path: "/api/auth/logout", method: "POST" });
}
