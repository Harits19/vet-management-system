const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

// Dev: tujuan proxy /api. Default backend lokal; set BACKEND_PROXY_URL utk pakai backend lain
// (mis. VPS) tanpa mengubah kode. Contoh: BACKEND_PROXY_URL=https://wedi-animal-care.ahlabs.my.id
const backendProxyUrl = (process.env.BACKEND_PROXY_URL || "http://localhost:3001").replace(/\/+$/, "");

/** @type {(phase: string) => import('next').NextConfig} */
module.exports = (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    reactStrictMode: true,
    // @vladmandic/face-api memakai require() dinamis (guard fs untuk node) yang tidak bisa
    // di-analisis webpack → "Critical dependency". Di browser require itu tidak pernah jalan;
    // jadikan external di server bundle + filter warning-nya.
    serverExternalPackages: ["@vladmandic/face-api", "@tensorflow/tfjs"],
    webpack: (config) => {
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        { module: /@vladmandic\/face-api/ },
      ];
      return config;
    },
    // Dev: frontend :3002 meneruskan /api ke backend (di produksi nginx yang mem-proxy).
    // BACKEND_PROXY_URL memungkinkan arahkan ke backend lain (VPS) — lihat atas file.
    ...(isDev
      ? {
          async rewrites() {
            return [
              {
                source: "/api/:path*",
                destination: `${backendProxyUrl}/api/:path*`,
              },
            ];
          },
        }
      : {}),
  };
};
