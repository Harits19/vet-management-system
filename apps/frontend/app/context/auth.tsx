"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { UserRole, AuthLoginResponse } from "@vet/shared";
import { useGetMe } from "@/api/useGetMe";
import { usePostLogin } from "@/api/usePostLogin";
import { usePostLogout } from "@/api/usePostLogout";

interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  doctorSignature?: string;
}

interface AuthContextType {
  user?: User;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const { data: me, isLoading: loading, invalidate: refreshUser } = useGetMe();
  const { mutateAsync: mutateLogin, data: login } = usePostLogin();
  const { mutateAsync: mutateLogout, isSuccess } = usePostLogout();

  const user = isSuccess ? undefined : me?.data || login?.data.user;

  const handleLogin = async (username: string, password: string) => {
    await mutateLogin({ username, password });
    router.push("/dashboard");
  };

  const logout = async () => {
    await mutateLogout();
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login: handleLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
