import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAntdMessage } from "./useAntdMessage";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export { API_URL };

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Request failed");
  }
  return json as T;
}

type Path =
  | "customers"
  | "letters"
  | "dashboard/summary"
  | "diagnosis-templates"
  | "letters"
  | "medical-histories"
  | "pets"
  | "products"
  | "services"
  | "transactions"
  | "users"
  | "auth/me"
  | "auth/login"
  | "auth/logout";

export type VetPath = `/api/${Path}`;

export interface VetQueryProps extends RequestInit {
  params?: Record<string, string | number | undefined>;
  url: VetPath;
  enabled?: boolean;
  showError?: boolean;
}

export function useVetQuery<TData>({
  url,
  enabled = true,
  showError = true,
  ...options
}: VetQueryProps) {
  const params = new URLSearchParams();
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value === undefined) return;
      params.append(key, String(value));
    });
  }
  const msg = useAntdMessage();

  const finalURL = `${url}?${params}`;
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [url] });
  };
  const query = useQuery<TData>({
    queryKey: [url, options],
    enabled,
    queryFn: async () => {
      try {
        const res = await apiFetch(finalURL, options);
        return res as TData;
      } catch (error: any) {
        if (showError) {
          msg.error(error.message);
        }
        throw error;
      }
    },
  });

  return {
    ...query,
    invalidate,
  };
}

export function useVetMutation<TResponse, TRequest>({
  url,
  options,
}: {
  url: VetPath;
  options?: { method: "POST" | "PUT" | "DELETE" | "PATCH" };
}) {
  const msg = useAntdMessage();
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [url] });
  };
  const mutation = useMutation<TResponse, any, TRequest>({
    mutationFn: async (value) => {
      try {
        const res = await apiFetch(url, { ...options, body: JSON.stringify(value) });
        return res as TResponse;
      } catch (error: any) {
        msg.error(error.message);
        throw error;
      }
    },
  });

  return {
    ...mutation,
    invalidate,
  };
}
