"use client";

import { App, message } from "antd";
import { MessageInstance } from "antd/es/message/interface";
import { createContext, useContext } from "react";

type ToastContextType = {
  api: MessageInstance;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [api, context] = message.useMessage();

  return (
    <ToastContext.Provider value={{ api }}>
      {context}
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
