import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: process.cwd(),
  },
  env: {
    NEXT_PUBLIC_HOPPIE_URL: process.env.NEXT_PUBLIC_HOPPIE_URL || 'http://www.hoppie.nl/acars/system/connect.html',
  },
};

export default nextConfig;
