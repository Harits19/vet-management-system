"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "@material-tailwind/react";

import { LayoutContextProvider } from "@/contexts/layout-context";

interface ProvidersProps {
  children: ReactNode;
}

function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <LayoutContextProvider>{children}</LayoutContextProvider>
    </ThemeProvider>
  );
}

export default Providers;
