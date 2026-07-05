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
        Our full menu, synced straight from Square.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const price = formatPrice(item.variations[0]?.priceCents ?? null);

          return (
            <Link key={item.id} href={`/shop/${item.id}`} className="group block">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-cream">
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                )}
              </div>
              <h2 className="mt-3 font-display text-lg font-semibold text-maroon">
                {item.name.trim()}
              </h2>
              <p className="text-terracotta font-medium">
                {price ?? "Ask for pricing"}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
