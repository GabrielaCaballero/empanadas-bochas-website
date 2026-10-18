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
  // Photos in /public are served with Next's default "don't cache" header,
  // so every visit re-downloaded them. A month is long enough to make repeat
  // visits fast; if a photo is ever replaced, give the new file a new name so
  // browsers don't keep showing the old one.
  async headers() {
    return [
      {
        source: "/photos/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
  images: {
    // Optimized copies (and Square's remote photos) are kept for 31 days
    // instead of the 4-hour default.
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "items-images-production.s3.us-west-2.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
