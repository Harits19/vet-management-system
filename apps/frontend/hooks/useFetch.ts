// import { useToast } from "@/components/Toast";
import { message } from "antd";
import { useEffect, useState } from "react";

interface FetchProps {
  body?: any;
  path?:
    | "/api/auth/login"
    | "/api/auth/me"
    | ""
    | "/api/products"
    | "/api/auth/logout"
    | "/api/products/import";
  method?: "POST" | "GET" | "PUT" | "DELETE";
  runOnMount?: boolean;
  params?: any;
}

const isFormData = (v: any): v is FormData =>
  typeof FormData !== "undefined" && v instanceof FormData;

const isPlainObject = (v: any): v is Record<string, any> =>
  typeof v === "object" && v !== null && !Array.isArray(v) && !isFormData(v);

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (
    typeof window !== "undefined" &&
    window.location.hostname.endsWith(".asse.devtunnels.ms")
  ) {
    return "https://sf641vt8-4000.asse.devtunnels.ms";
  }

  return "http://localhost:4000";
};

export async function fetcher<T, TBody = any>({
  body,
  path = "",
  method = "GET",
  params,
}: FetchProps): Promise<T> {
  const BASE_URL = getBaseUrl();
  let url = `${BASE_URL}${path}`;

  if (params) {
    const stringParam = Object.fromEntries(
      Object.entries(params).map(([key, value]) => [key, String(value)]),
    );
    const queryParams = new URLSearchParams(stringParam);
    url += `?${queryParams.toString()}`;
  }
  let finalBody: BodyInit | undefined;
  let headers: Record<string, string> = {};

  if (body instanceof FormData) {
    finalBody = body;

    // ❗ jangan set Content-Type
    // browser akan otomatis set multipart/form-data
  } else if (isPlainObject(body)) {
    finalBody = JSON.stringify(body);

    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers,
    body: finalBody,
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
  showResponse = false,
  ...fetchProps
}: FetchProps & {
  runOnInit?: boolean;
  showResponse?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [data, setData] = useState<TResponse>();
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

    let finalBody;
    if (runOnInit) {
      finalBody = fetchProps.body;
    } else {
      finalBody = mutateBody;
    }

    try {
      const data = await fetcher<TResponse, TBody>({
        ...fetchProps,
        body: finalBody,
      });
      if (showResponse) {
        message.success(JSON.stringify(data, null, 2));
      }
      onSuccess?.();
      setData(data);
      return data;
    } catch (error: any) {
      setData(undefined);
      message.error(error?.message);
      setError(error);
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, data, mutate };
}
