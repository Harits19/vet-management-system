import useFetch from "../useFetch";

export default function usePostLogin() {
  return useFetch({
    method: "POST",
    path: "/api/auth/login",
  });
}
