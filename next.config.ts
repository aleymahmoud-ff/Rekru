import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // CV uploads pass through server actions; default cap is 1MB.
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Tell the CDN not to cache HTML/RSC responses. Content-hashed build assets
  // under /_next/static stay immutable; everything else is served fresh so the
  // CDN can never hold a stale page with outdated Server Action references.
  async headers() {
    return [
      {
        source: '/((?!_next/static|_next/image).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
    ]
  },
};

export default nextConfig;
