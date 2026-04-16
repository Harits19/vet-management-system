import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vet Management System",
  description: "Fresh frontend and backend starter for vet management system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
