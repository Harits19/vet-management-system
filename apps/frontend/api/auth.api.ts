import { ApiResponse } from "../../shared/types/api";
import { AuthLoginRequest, CookieRequest, CookieResponse } from "../../shared/types/auth.type";
import useFetch from "../hooks/useFetch";

export function usePostLogout() {
  return useFetch({ path: "/api/auth/logout", method: "POST" });
}

export function usePostLogin() {
  return useFetch<undefined, AuthLoginRequest>({
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


export function usePostCookie() {

  return useFetch<undefined, CookieRequest>({
    method: "POST",
    path: "/api/auth/cookie",

  })
}

export function useGetCookie() {

  return useFetch<ApiResponse<CookieResponse>>({
    method: "GET",
    path: "/api/auth/cookie",
    runOnMount: true,
    runOnInit: true,
  })

}