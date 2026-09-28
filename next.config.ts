import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // The default is 1 MB. Keep authentication action payloads intentionally small.
    serverActions: {
      bodySizeLimit: "1mb",
    },
  },
};

export default nextConfig;
