"use client";

import { useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { ProductRequest, ProductResponse } from "@/shared/types";

export default function usePostProduct() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function postProduct(payload: ProductRequest) {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as ProductResponse & {
        success?: boolean;
        message: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal menyimpan produk.");
      }

      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal menyimpan produk.";
      setErrorMessage(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  return { postProduct, isLoading, errorMessage };
}
