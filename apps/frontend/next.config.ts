import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@vet/shared-types"]
};

export default nextConfig;

