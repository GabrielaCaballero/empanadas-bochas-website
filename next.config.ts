import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The old single "Shop" page was split into Empanadas / Alfajores. Product
  // pages (/shop/[id]) are unchanged; only the bare /shop listing moved.
  async redirects() {
    return [{ source: "/shop", destination: "/empanadas", permanent: true }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "items-images-production.s3.us-west-2.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
