"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { UserRole, AuthLoginResponse } from "@vet/shared";
import { useAntdMessage } from "@/hooks/useAntdMessage";

interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  doctorSignature?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: {
    fetch: (username: string, password: string) => Promise<void>;
    loading: boolean;
  };
  logout: {
    fetch: () => Promise<void>;
    loading: boolean;
  };
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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

export function useQuery<TResponse>(path: string, options?: RequestInit) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TResponse | null>(null);

  const fetch = async () => {
    try {
      const response = await apiFetch<{ data: TResponse }>(path, options);
      setData(response.data);
      return response.data;
    } catch (error) {
      setData(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  return { loading, data, setData, fetch };
}

export function useMutation<TResponse>({ defaultErrorMessage }: { defaultErrorMessage?: string }) {
  const [loading, setLoading] = useState(false);
  const msg = useAntdMessage();

  const fetch = async (path: string, options?: RequestInit) => {
    try {
      setLoading(true);
      const response = await apiFetch<{ data: TResponse }>(path, options);
      return response.data;
    } catch (err: any) {
      msg.error(err.message || defaultErrorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { loading, fetch };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const {
    data: user,
    loading,
    setData: setUser,
    fetch: refreshUser,
  } = useQuery<User>("/api/auth/me");
  const login = useMutation<AuthLoginResponse>({ defaultErrorMessage: "Login failed" });
  const logout = useMutation({ defaultErrorMessage: "Logout failed" });

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login: {
          loading: login.loading,
          fetch: async (username: string, password: string) => {
            const res = await login.fetch("/api/auth/login", {
              method: "POST",
              body: JSON.stringify({ username, password }),
            });
            if (!res) return;
            setUser(res.user);
            router.push("/dashboard");
          },
        },
        logout: {
          loading: logout.loading,
          fetch: async () => {
            await logout.fetch("/api/auth/logout", { method: "POST" });
            setUser(null);
            router.push("/login");
          },
        },
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
