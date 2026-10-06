import { apiFetch } from "@/context/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAntdMessage } from "./useAntdMessage";

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
}

export function useVetQuery<TData>({ url, enabled = true, ...options }: VetQueryProps) {
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
        msg.error(error.message);
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
