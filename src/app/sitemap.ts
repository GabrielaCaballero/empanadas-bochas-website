import type { MetadataRoute } from "next";
import { getCatalogItems } from "@/lib/square";

const SITE_URL = "https://empanadasbochas.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/events`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.5 },
  ];

  // Catalog can fail to load (Square outage, missing credentials) — the
  // static routes above still matter even if the product pages can't be
  // listed this run, so a failure here shouldn't take down the whole file.
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const items = await getCatalogItems();
    productRoutes = items.map((item) => ({
      url: `${SITE_URL}/shop/${item.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (err) {
    console.error("Sitemap: failed to load catalog items", err);
  }

  return [...staticRoutes, ...productRoutes];
}
