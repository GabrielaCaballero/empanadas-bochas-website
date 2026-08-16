import { Suspense } from "react";
import { getCatalogItems } from "@/lib/square";
import CartClient from "@/components/CartClient";

export const revalidate = 300;

export default async function CartPage() {
  const items = await getCatalogItems();
  const sauceItem = items.find((i) => i.name.trim().toLowerCase() === "sauce");
  const sauceVariations = (sauceItem?.variations ?? [])
    .filter((v) => v.priceCents != null)
    .map((v) => ({ id: v.id, name: v.name, priceCents: v.priceCents as number }));

  // Looked up by itemId rather than stored on the cart line item itself, so
  // the cart's localStorage shape doesn't need to change (and old carts
  // already in someone's browser keep working).
  const productsById = Object.fromEntries(
    items.map((item) => [
      item.id,
      { name: item.name.trim(), imageUrl: item.imageUrl },
    ]),
  );

  // Featured suggestion for the empty-cart state — the biggest box, since
  // that's the best "come back and order" nudge.
  const suggested =
    items.find((i) => /box of 12/i.test(i.name)) ??
    items.find((i) => /box of 6/i.test(i.name)) ??
    null;
  const suggestedProduct = suggested
    ? {
        id: suggested.id,
        name: suggested.name.trim(),
        imageUrl: suggested.imageUrl,
        priceCents: suggested.variations[0]?.priceCents ?? null,
      }
    : null;

  return (
    <Suspense>
      <CartClient
        sauceVariations={sauceVariations}
        productsById={productsById}
        suggestedProduct={suggestedProduct}
      />
    </Suspense>
  );
}
