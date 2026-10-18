import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // /empanadas and /alfajores briefly existed as separate pages; they're now
  // the Savory / Sweet toggle on /shop. Kept as redirects in case anyone
  // bookmarked or a search engine picked up those URLs.
  async redirects() {
    return [
      { source: "/empanadas", destination: "/shop?type=savory", permanent: true },
      { source: "/alfajores", destination: "/shop?type=sweet", permanent: true },
    ];
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
