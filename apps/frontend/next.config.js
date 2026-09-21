const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

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
    // Dev: frontend :3002 meneruskan /api ke backend :3001 (di produksi nginx yang mem-proxy).
    ...(isDev
      ? {
          async rewrites() {
            return [{ source: "/api/:path*", destination: "http://localhost:3001/api/:path*" }];
          },
        }
      : {}),
  };
};
