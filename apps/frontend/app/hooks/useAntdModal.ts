"use client";

import { App } from "antd";

export function useAntdModal() {
  const { modal } = App.useApp();
  return modal;
}
