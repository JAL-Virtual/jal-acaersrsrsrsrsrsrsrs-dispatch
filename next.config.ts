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
    HOPPIE_LOGON_CODE: process.env.HOPPIE_LOGON_CODE,
    DISPATCH_CALLSIGN: process.env.DISPATCH_CALLSIGN,
  },
};

export default nextConfig;
