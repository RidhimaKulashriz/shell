import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

const backendUrl = process.env.BACKEND_URL?.replace(/\/$/, "");
const nextConfigWithBackend: NextConfig = {
  ...nextConfig,
  async rewrites() {
    if (!backendUrl) return [];
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfigWithBackend;
