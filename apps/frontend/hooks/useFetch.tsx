import { useToast } from "@/components/Toast";
import { useEffect, useState } from "react";

interface FetchProps {
  body?: Record<string, any>;
  path?: "/api/auth/login" | "" | "/api/products";
  method?: "POST" | "GET" | "PUT" | "DELETE";
  runOnMount?: boolean;
}

export async function fetcher<T = any>({
  body,
  path = "",
  method = "GET",
}: FetchProps): Promise<T> {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  console.log("body", body);
  console.log("path", path);
  console.log("method", method);
  console.log("BASE_URL", BASE_URL);

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
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

export default function useFetch<TResponse = any>({
  method,
  path,
  body,
  runOnInit = false,
}: FetchProps & {
  runOnInit?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [data, setData] = useState<TResponse>();
  const { api } = useToast();
  useEffect(() => {
    if (!runOnInit) return;
    mutate({});
  }, []);

  const mutate = async ({ body: mutateBody }: Pick<FetchProps, "body">) => {
    setLoading(true);
    setError(undefined);
    setData(undefined);
    console.log("body", body);
    console.log("mutateBody", mutateBody);
    try {
      const data = await fetcher<TResponse>({
        body: { ...body, ...mutateBody },
        method,
        path,
      });
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
