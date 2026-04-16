"use client";

import { useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { AuthResponse, LoginInput } from "@/shared/types";

export default function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function login(payload: LoginInput) {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        success?: boolean;
        message: string;
        data?: AuthResponse["data"];
      };

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "Login gagal.");
      }

      return result as AuthResponse;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login gagal.";
      setErrorMessage(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  return { login, isLoading, errorMessage };
}
