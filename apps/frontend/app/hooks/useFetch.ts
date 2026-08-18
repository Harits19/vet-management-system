import { useCallback, useEffect, useState } from "react";
import { useAntdMessage } from "./useAntdMessage";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export { API_URL };

export function useFetch<Response>({
  options,
  path,
  enabled = true,
  runOnInit = false,
}: {
  path: string;
  options?: RequestInit;
  enabled?: boolean;
  runOnInit?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Response | null>(null);
  const msg = useAntdMessage();

  const fetcher = useCallback(
    async (params?: { path: string; options?: RequestInit }) => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}${params?.path || path}`, {
          credentials: "include",
          ...options,
          ...params?.options,
          headers: {
            "Content-Type": "application/json",
            ...options?.headers,
            ...params?.options?.headers,
          },
        });
        const json = await res.json();
        if (!res.ok || json.success === false) {
          throw new Error(json.message || "Request failed");
        }
        setData(json);
        return json as Response;
      } catch (error: any) {
        msg.error(error.message);
      } finally {
        setLoading(false);
      }
    },
    [msg, options, path]
  );

  useEffect(() => {
    if (!runOnInit) return;
    if (!enabled) return;
    fetcher();
  }, [fetcher, enabled, runOnInit]);

  return {
    data,
    loading,
    setData,
    fetcher,
  };
}
