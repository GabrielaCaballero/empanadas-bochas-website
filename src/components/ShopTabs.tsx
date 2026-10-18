"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { CatalogItem } from "@/lib/square";
import { sectionOf } from "@/lib/catalog-sections";
import ProductGrid from "@/components/ProductGrid";

type Tab = "savory" | "sweet";

const TABS: {
  id: Tab;
  label: string;
  emoji: string;
  image: string;
  imageAlt: string;
  imagePosition: string;
  heading: string;
  body: string;
}[] = [
  {
    id: "savory",
    label: "Savory",
    emoji: "🥟",
    image: "/photos/empanada-2.webp",
    imageAlt: "A box of freshly baked Empanadas Bochas empanadas",
    imagePosition: "50% 78%",
    heading: "Empanadas, the Argentine way",
    body: "Hand-folded, baked fresh, from the recipes we grew up with.",
  },
  {
    id: "sweet",
    label: "Sweet",
    emoji: "🍪",
    image: "/photos/shop-alfajores.webp",
    imageAlt: "Two Empanadas Bochas alfajores on a wooden plate",
    imagePosition: "50% 50%",
    heading: "Alfajores, a sweet Argentine classic",
    body: "Soft cookies hugging creamy dulce de leche.",
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

      {/* key remounts the block on tab change so the new photo and copy
          fade in instead of snapping. */}
      {/* key remounts the block on tab change so the new photo and copy
          fade in instead of snapping. The copy sits ON the photo so the
          products start as high up the page as possible. */}
      <div
        key={active.id}
        className="relative mt-8 flex min-h-44 w-full animate-[fadein_0.4s_ease-out] flex-col justify-end overflow-hidden rounded-3xl bg-maroon sm:min-h-0 sm:aspect-[7/2] sm:justify-center"
      >
        <Image
          src={active.image}
          alt={active.imageAlt}
          fill
          priority
          className="object-cover"
          style={{ objectPosition: active.imagePosition }}
          sizes="(min-width: 1152px) 1104px, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-maroon/90 via-maroon/50 to-maroon/10 sm:bg-gradient-to-r sm:from-maroon/85 sm:via-maroon/50 sm:to-transparent" />
        <div className="relative p-5 pt-16 sm:max-w-xl sm:p-10">
          <h2 className="font-display text-xl font-semibold text-cream sm:text-3xl">
            {active.heading}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-cream/90 sm:mt-2 sm:text-base">
            {active.body}
          </p>
        </div>
      </div>

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
