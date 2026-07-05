import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCatalogItems, formatPrice } from "@/lib/square";

export const revalidate = 300;

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const items = await getCatalogItems();
  const item = items.find((i) => i.id === slug);

  if (!item) notFound();

  const price = formatPrice(item.variations[0]?.priceCents ?? null);
  const related = items.filter((i) => i.id !== item.id).slice(0, 3);

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
      <div className="grid gap-10 sm:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-cream">
          {item.imageUrl && (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(min-width: 640px) 50vw, 100vw"
              priority
            />
          )}
        </div>

        <div>
          <h1 className="font-display text-4xl font-semibold text-maroon">
            {item.name.trim()}
          </h1>
          <p className="mt-2 text-xl font-medium text-terracotta">
            {price ?? "Ask for pricing"}
          </p>
          {item.description && (
            <p className="mt-4 text-maroon/70">{item.description}</p>
          )}

          {item.flavors && (
            <div className="mt-8">
              <h2 className="text-sm font-medium text-maroon/60">
                Choose your flavors
              </h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {item.flavors.map((flavor) => (
                  <li
                    key={flavor}
                    className="rounded-full bg-cream px-3 py-1 text-sm text-maroon"
                  >
                    {flavor}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            className="mt-10 rounded-full bg-terracotta px-6 py-3 font-semibold text-background transition-colors hover:bg-rust"
          >
            Add to Cart
          </button>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-20">
          <h2 className="font-display text-2xl font-semibold text-maroon">
            You might also like
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-3">
            {related.map((r) => {
              const rPrice = formatPrice(r.variations[0]?.priceCents ?? null);
              return (
                <Link key={r.id} href={`/shop/${r.id}`} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-cream">
                    {r.imageUrl && (
                      <Image
                        src={r.imageUrl}
                        alt={r.name}
                        fill
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        sizes="(min-width: 640px) 33vw, 100vw"
                      />
                    )}
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold text-maroon">
                    {r.name.trim()}
                  </h3>
                  <p className="text-terracotta font-medium">
                    {rPrice ?? "Ask for pricing"}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
