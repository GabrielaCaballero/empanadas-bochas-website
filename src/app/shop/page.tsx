import { Suspense } from "react";
import type { Metadata } from "next";
import { getActiveSalesTax } from "@/lib/square";
import { getShopProducts } from "@/lib/shop-products";
import ShopTabs from "@/components/ShopTabs";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Order homemade Argentine empanadas and alfajores online in NYC. Boxes of 3, 6, or 12, singles, sweets, and sauces. Pickup or delivery.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage() {
  const [items, salesTax] = await Promise.all([
    getShopProducts(),
    getActiveSalesTax(),
  ]);

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 sm:py-10">
      <h1 className="font-display text-4xl font-semibold text-maroon">Shop</h1>
      {/* useSearchParams inside ShopTabs needs a Suspense boundary so the
          rest of the page can stay statically cached. */}
      <Suspense>
        <ShopTabs items={items} hasTax={Boolean(salesTax)} />
      </Suspense>
    </section>
  );
}
