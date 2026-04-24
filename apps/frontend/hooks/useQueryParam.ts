"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import useDebounce from "./useDebounce";

export default function useQueryParams<T>(defaultValue: T) {
  const [state, setStateBase] = useState<T>(defaultValue);
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceState = useDebounce(state);

  useEffect(() => {
    const newParams = new URLSearchParams(searchParams.toString());

    Object.entries(debounceState as Record<string, any>).forEach(
      ([key, value]) => {
        if (value === undefined || value === null || value === "") {
          newParams.delete(key);
        } else {
          newParams.set(key, String(value));
        }
      },
    );

    router.push(`?${newParams.toString()}`);
  }, [JSON.stringify(debounceState)]);

  const setState: Dispatch<SetStateAction<T>> = (value) => {
    setStateBase((prev) =>
      typeof value === "function" ? (value as (prev: T) => T)(prev) : value,
    );
  };

  return {
    debounceQuery: debounceState,
    setQuery: setState,
    query: state,
  } as const;
}
