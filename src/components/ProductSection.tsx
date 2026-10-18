import Link from "next/link";
import { getCatalogItems, getActiveSalesTax } from "@/lib/square";
import { sectionOf, type Section } from "@/lib/catalog-sections";
import ProductGrid from "@/components/ProductGrid";

const OTHER_LINKS: Record<Section, { href: string; label: string }[]> = {
  empanadas: [
    { href: "/alfajores", label: "Alfajores" },
    { href: "/catering", label: "Catering & private events" },
  ],
  alfajores: [
    { href: "/empanadas", label: "Empanadas" },
    { href: "/catering", label: "Catering & private events" },
  ],
};

export default async function ProductSection({
  section,
  title,
  blurb,
}: {
  section: Section;
  title: string;
  blurb: string;
}) {
  const [items, salesTax] = await Promise.all([
    getCatalogItems(),
    getActiveSalesTax(),
  ]);
  const sectionItems = items.filter((i) => sectionOf(i) === section);

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
      <h1 className="font-display text-4xl font-semibold text-maroon">
        {title}
      </h1>
      <p className="mt-3 max-w-xl text-maroon/70">{blurb}</p>

      {sectionItems.length > 0 ? (
        <ProductGrid items={sectionItems} hasTax={Boolean(salesTax)} />
      ) : (
        <p className="mt-10 text-maroon/70">
          Nothing here right now — check back soon.
        </p>
      )}

      <div className="mt-16 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-maroon/10 pt-6 text-sm">
        <span className="font-medium text-maroon/60">Also from us:</span>
        {OTHER_LINKS[section].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="font-semibold text-terracotta hover:text-rust"
          >
            {l.label} →
          </Link>
        ))}
      </div>
    </section>
  );
}
