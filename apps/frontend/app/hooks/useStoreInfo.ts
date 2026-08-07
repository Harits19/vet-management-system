"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../context/auth";

export interface StoreInfo {
  name: string;
  address: string;
  whatsapp: string;
  phone: string;
}

// Cache modul: fetch sekali per session, tidak refetch tiap halaman.
let cache: StoreInfo | null = null;
let inflight: Promise<StoreInfo | null> | null = null;

export function useStoreInfo(): StoreInfo | null {
  const [info, setInfo] = useState<StoreInfo | null>(cache);

  useEffect(() => {
    if (cache) {
      setInfo(cache);
      return;
    }
    if (!inflight) {
      inflight = apiFetch<{ data: StoreInfo }>("/api/config/store")
        .then((res) => {
          cache = res.data;
          return res.data;
        })
        .catch(() => null)
        .finally(() => {
          inflight = null;
        });
    }
    inflight.then(setInfo);
  }, []);

  return info;
}
