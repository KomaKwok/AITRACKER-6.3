import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  typedRoutes: true,
  outputFileTracingRoot: path.resolve(__dirname),
  allowedDevOrigins: ["198.18.0.1"],
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }

    return config;
  }
};

export default nextConfig;
