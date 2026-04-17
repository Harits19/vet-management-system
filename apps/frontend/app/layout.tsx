import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vet Management System",
  description: "Monorepo Next.js + Express.js untuk klinik hewan"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

