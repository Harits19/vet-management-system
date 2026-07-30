"use client";

import { App } from "antd";

/**
 * Hook untuk mengakses message API antd via App.useApp()
 * Menggantikan static `message.error/success/warning` dari antd
 * yang menghasilkan warning "Static function can not consume context".
 */
export function useAntdMessage() {
  const { message } = App.useApp();
  return message;
}
