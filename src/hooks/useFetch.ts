"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

interface UseFetchOptions {
  path: string;
}

export default function useFetch<TResponse>({ path }: UseFetchOptions) {
  const [data, setData] = useState<TResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function run() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch(`${API_BASE_URL}${path}`, {
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Request gagal diproses.");
        }

        if (isMounted) {
          setData(result);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Terjadi kesalahan.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    run();

    return () => {
      isMounted = false;
    };
  }, [path]);

  return { data, isLoading, errorMessage };
}
