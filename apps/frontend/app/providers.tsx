"use client";

import { ConfigProvider, App as AntApp, theme as antdTheme } from "antd";
import { AuthProvider } from "./context/auth";
import { ThemeProvider, useTheme } from "./context/theme";

function ThemedConfigProvider({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: "#1677ff",
          borderRadius: 6,
        },
      }}
    >
      <AntApp>
        <AuthProvider>{children}</AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ThemedConfigProvider>{children}</ThemedConfigProvider>
    </ThemeProvider>
  );
}
