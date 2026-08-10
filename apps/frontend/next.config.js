/** @type {import('next').NextConfig} */
const nextConfig = {
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
};

module.exports = nextConfig;
