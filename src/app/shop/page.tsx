import Image from "next/image";
import Link from "next/link";
import { getCatalogItems, formatPrice } from "@/lib/square";

export const revalidate = 300;

export default async function ShopPage() {
  const items = await getCatalogItems();

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
      <h1 className="font-display text-4xl font-semibold text-maroon">Shop</h1>
      <p className="mt-3 max-w-xl text-maroon/70">
        Order online for pickup or delivery.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
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
    </section>
  );
}
