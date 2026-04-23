import { useToast } from "@/components/Toast";
import { useEffect, useState } from "react";

interface FetchProps<TBody = any> {
  body?: TBody;
  path?: "/api/auth/login" | "" | "/api/products" | "/api/auth/logout";
  method?: "POST" | "GET" | "PUT" | "DELETE";
  runOnMount?: boolean;
  params?: any;
}

export async function fetcher<T, TBody>({
  body,
  path = "",
  method = "GET",
  params,
}: FetchProps<TBody>): Promise<T> {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  let url = `${BASE_URL}${path}`;

  if (params) {
    const stringParam = Object.fromEntries(
      Object.entries(params).map(([key, value]) => [key, String(value)]),
    );
    const queryParams = new URLSearchParams(stringParam);
    url += `?${queryParams.toString()}`;
  }

  const res = await fetch(url, {
    method,
    credentials: "include",

    headers: {
      "Content-Type": "application/json",
    },
    body: body && method !== "GET" ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.text().catch((e) => {
      const error = `Error: ${e || e.message || "Unexpected error"}`;
      return error;
    });
    throw new Error(error || "Something went wrong");
  }

  return res.json();
}

export default function useFetch<TResponse, TBody = any>({
  runOnInit = false,
  ...fetchProps
}: FetchProps<TBody> & {
  runOnInit?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [data, setData] = useState<TResponse>();
  const { api } = useToast();
  useEffect(() => {
    if (!runOnInit) return;
    mutate({});
  }, [JSON.stringify(fetchProps.params)]);

  const mutate = async ({
    body: mutateBody,
    onSuccess,
  }: Pick<FetchProps, "body"> & {
    onSuccess?: () => void;
  }) => {
    setLoading(true);
    setError(undefined);
    setData(undefined);

    try {
      const data = await fetcher<TResponse, TBody>({
        body: { ...fetchProps.body, ...mutateBody },
        ...fetchProps,
      });
      onSuccess?.();
      setData(data);
    } catch (error: any) {
      setData(undefined);
      api.error(error?.message);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, data, mutate };
}
