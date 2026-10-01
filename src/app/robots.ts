import type { MetadataRoute } from "next";

const SITE_URL = "https://empanadasbochas.com";

// Deliberately permissive — no disallow list for specific crawlers, so this
// doesn't accidentally block AI crawlers (GPTBot, ClaudeBot, PerplexityBot,
// Google-Extended, etc.) that currently drive "which empanada place should
// I go to" answers in chat assistants, same as it shouldn't block Google's
// own crawler. /cart, /checkout, and /api are excluded since they're
// per-visitor/transactional, not content worth indexing.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/cart", "/checkout", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
