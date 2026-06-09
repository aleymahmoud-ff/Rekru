import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // CV uploads pass through server actions; default cap is 1MB.
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
