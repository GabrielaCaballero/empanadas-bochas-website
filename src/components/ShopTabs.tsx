"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { CatalogItem } from "@/lib/square";
import { sectionOf } from "@/lib/catalog-sections";
import ProductGrid from "@/components/ProductGrid";

type Tab = "savory" | "sweet";

const TABS: { id: Tab; label: string; emoji: string; blurb: string }[] = [
  {
    id: "savory",
    label: "Savory",
    emoji: "🥟",
    blurb: "Handmade empanadas, baked fresh. Boxes, singles, and sauces.",
  },
  {
    id: "sweet",
    label: "Sweet",
    emoji: "🍪",
    blurb: "Soft, filled Argentine alfajores (sandwich cookies).",
  },
];

export default function ShopTabs({
  items,
  hasTax,
}: {
  items: CatalogItem[];
  hasTax: boolean;
}) {
  // The URL is the source of truth, so /shop?type=sweet (the old /alfajores
  // redirect, or a shared link) opens on Sweet and back/forward just work.
  const router = useRouter();
  const tab: Tab = useSearchParams().get("type") === "sweet" ? "sweet" : "savory";

  function choose(next: Tab) {
    router.replace(`/shop?type=${next}`, { scroll: false });
  }

  const section = tab === "savory" ? "empanadas" : "alfajores";
  const visible = items.filter((i) => sectionOf(i) === section);
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <>
      <div
        role="tablist"
        aria-label="Menu type"
        className="mt-8 inline-flex rounded-full bg-cream p-1"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => choose(t.id)}
            className={`rounded-full px-6 py-2 text-sm font-semibold transition-colors ${
              tab === t.id
                ? "bg-terracotta text-background shadow-sm"
                : "text-maroon hover:text-terracotta"
            }`}
          >
            <span aria-hidden="true">{t.emoji}</span> {t.label}
          </button>
        ))}
      </div>

      <p className="mt-4 max-w-xl text-maroon/70">{active.blurb}</p>

      {visible.length > 0 ? (
        <ProductGrid items={visible} hasTax={hasTax} />
      ) : (
        <p className="mt-10 text-maroon/70">
          Nothing here right now. Check back soon.
        </p>
      )}

      <div className="mt-16 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-maroon/10 pt-6 text-sm">
        <span className="font-medium text-maroon/60">Also from us:</span>
        <Link
          href="/catering"
          className="font-semibold text-terracotta hover:text-rust"
        >
          Catering &amp; private events →
        </Link>
      </div>
    </>
  );
}
