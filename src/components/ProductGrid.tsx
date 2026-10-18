import Image from "next/image";
import Link from "next/link";
import { formatPrice, type CatalogItem } from "@/lib/square";

// The photo-card grid used by every product section (Empanadas, Alfajores).
// Product pages themselves stay at /shop/[id] regardless of section, so
// existing product links and search results keep working.
export default function ProductGrid({
  items,
  hasTax,
}: {
  items: CatalogItem[];
  hasTax: boolean;
}) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const price = formatPrice(item.variations[0]?.priceCents ?? null);

        const isBoxOf12 = item.requiredFlavorCount === 12;

        return (
          <Link
            key={item.id}
            href={`/shop/${item.id}`}
            className={`group relative block aspect-4/5 overflow-hidden rounded-3xl bg-cream shadow-sm transition-shadow duration-300 hover:shadow-xl ${
              isBoxOf12 ? "ring-2 ring-inset ring-terracotta" : ""
            }`}
          >
            {/* The photo fills most of the card by default and grows to
                cover the whole thing on hover, so the caption below
                becomes an overlay sitting on top of it (see the scrim +
                caption below) instead of two separate zones. */}
            <div className="absolute inset-x-0 top-0 h-[72%] overflow-hidden transition-[height] duration-500 ease-out group-hover:h-full">
              {item.imageUrl && (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
              )}
              {isBoxOf12 && (
                <span className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-terracotta px-3 py-1.5 text-xs font-bold tracking-wide text-background shadow-lg">
                  🎉 2 FREE
                </span>
              )}
            </div>

            {/* Dark scrim so the caption stays legible once it's sitting
                on top of the now-expanded photo instead of the cream
                card background. */}
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="absolute inset-x-0 bottom-0 p-4">
              <h2 className="font-display text-lg font-semibold text-maroon transition-colors duration-300 group-hover:text-background">
                {item.name.trim()}
              </h2>
              <p className="mt-0.5 font-medium text-terracotta transition-colors duration-300 group-hover:text-cream">
                {price ?? "Ask for pricing"}
                {price && hasTax && (
                  <span className="ml-1 text-xs font-normal text-maroon/50 transition-colors duration-300 group-hover:text-cream/70">
                    + tax
                  </span>
                )}
                {isBoxOf12 && (
                  <span className="ml-1.5 font-semibold text-maroon/60 transition-colors duration-300 group-hover:text-cream/80">
                    · 14 empanadas, 2 free!
                  </span>
                )}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
