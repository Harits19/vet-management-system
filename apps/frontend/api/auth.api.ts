import useFetch from "../hooks/useFetch";

export function usePostLogout() {
  return useFetch({ path: "/api/auth/logout", method: "POST" });
}

export function usePostLogin() {
  return useFetch({
    method: "POST",
    path: "/api/auth/login",
  });
}

export function useGetMe() {
  return useFetch({
    method: "GET",
    path: "/api/auth/me",
  });
}
