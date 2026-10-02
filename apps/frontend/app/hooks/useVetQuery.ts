import { apiFetch } from "@/context/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAntdMessage } from "./useAntdMessage";

export interface VetQueryProps extends RequestInit {
  params?: Record<string, string | number | undefined>;
  url: string;
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
