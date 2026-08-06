import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Vet Management System",
  description: "Sistem Kasir Terintegrasi Toko Hewan & Praktek Dokter Hewan",
};

// Set data-theme + color-scheme sebelum paint supaya tidak ada flash tema
// (jalan di browser, sebelum React hydration).
const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('vet-theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;var r=document.documentElement;r.setAttribute('data-theme',d?'dark':'light');r.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
