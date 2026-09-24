"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import type { CatalogItem } from "@/lib/square";
import { flavorInfo } from "@/lib/flavor-info";

// Box of 12 runs a "buy 12, get 2 free" promo — customers pick 14 flavors
// total and receive 14 empanadas, still charged the $60 Box-of-12 price.
// Square's catalog only defines the paid 12 (via requiredFlavorCount), so
// this bumps the picker's required count for that one product rather than
// changing catalog data the business owner manages directly in Square.
const BOX_OF_12_PROMO_COUNT = 14;

export default function AddToCart({ item }: { item: CatalogItem }) {
  const { addItem } = useCart();
  const rawRequired = item.requiredFlavorCount ?? 0;
  const isBoxOf12 = rawRequired === 12;
  const required = isBoxOf12 ? BOX_OF_12_PROMO_COUNT : rawRequired;
  const hasFlavors = Boolean(item.flavors?.length && rawRequired > 0);
  const hasVariantChoice = !hasFlavors && item.variations.length > 1;

  const [selectedVariationId, setSelectedVariationId] = useState(
    item.variations[0]?.id ?? "",
  );
  const selectedVariation =
    item.variations.find((v) => v.id === selectedVariationId) ??
    item.variations[0];
  const price = selectedVariation?.priceCents ?? 0;

  const [flavorCounts, setFlavorCounts] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [lastAddedCount, setLastAddedCount] = useState(0);

  const totalFlavorsSelected = Object.values(flavorCounts).reduce(
    (a, b) => a + b,
    0,
  );
  const canAdd = hasFlavors ? totalFlavorsSelected === required : true;
  const selectedEntries = Object.entries(flavorCounts).filter(
    ([, count]) => count > 0,
  );

  function changeFlavor(flavor: string, delta: number) {
    setFlavorCounts((prev) => {
      const current = prev[flavor] ?? 0;
      if (delta > 0 && totalFlavorsSelected >= required) return prev;
      return { ...prev, [flavor]: Math.max(0, current + delta) };
    });
    setJustAdded(false);
  }

  function handleAdd() {
    const name = hasVariantChoice
      ? `${item.name.trim()} - ${selectedVariation?.name}`
      : item.name.trim();

    addItem({
      itemId: item.id,
      variationId: selectedVariation?.id ?? "",
      name,
      unitPriceCents: price,
      quantity: hasFlavors ? 1 : quantity,
      flavors: hasFlavors ? flavorCounts : undefined,
    });
    setLastAddedCount(hasFlavors ? required : quantity);
    setJustAdded(true);
    setFlavorCounts({});
    setQuantity(1);
  }

  return (
    <div>
      {hasFlavors ? (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-medium text-maroon/60">
              Choose your flavors
              {isBoxOf12 && (
                <span className="rounded-full bg-terracotta px-2 py-0.5 text-xs font-bold tracking-wide text-background">
                  🎉 2 FREE
                </span>
              )}
            </h2>
            <span className="text-sm font-semibold text-maroon">
              {totalFlavorsSelected}/{required}
            </span>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {item.flavors!.map((flavor) => {
              const info = flavorInfo.find((f) => f.name === flavor);
              const count = flavorCounts[flavor] ?? 0;
              return (
                <div
                  key={flavor}
                  className={`flex items-center gap-3 rounded-2xl border p-2 transition-colors ${
                    count > 0
                      ? "border-terracotta bg-terracotta/5"
                      : "border-maroon/10"
                  }`}
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream">
                    {info?.image && (
                      <Image
                        src={info.image}
                        alt={flavor}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    )}
                  </div>
                  <span className="flex-1 text-sm font-medium text-maroon">
                    {flavor}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => changeFlavor(flavor, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-maroon/30 text-maroon"
                    >
                      −
                    </button>
                    <span className="w-4 text-center text-maroon">
                      {count}
                    </span>
                    <button
                      type="button"
                      onClick={() => changeFlavor(flavor, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-maroon/30 text-maroon"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedEntries.length > 0 && (
            <div className="mt-3 rounded-xl bg-cream px-4 py-2 text-sm text-maroon/80">
              <span className="font-medium text-maroon">
                Selected flavors:{" "}
              </span>
              {selectedEntries
                .map(([flavor, count]) => `${count}x ${flavor}`)
                .join(", ")}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {hasVariantChoice && (
            <div>
              <h2 className="text-sm font-medium text-maroon/60">
                Choose an option
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.variations.map((variation) => (
                  <button
                    key={variation.id}
                    type="button"
                    onClick={() => setSelectedVariationId(variation.id)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      variation.id === selectedVariationId
                        ? "border-terracotta bg-terracotta text-background"
                        : "border-maroon/30 text-maroon hover:bg-maroon/5"
                    }`}
                  >
                    {variation.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-maroon/30 text-maroon"
            >
              −
            </button>
            <span className="w-6 text-center text-maroon">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-maroon/30 text-maroon"
            >
              +
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={!canAdd}
        onClick={handleAdd}
        className="mt-6 rounded-full bg-terracotta px-6 py-3 font-semibold text-background transition-colors hover:bg-rust disabled:cursor-not-allowed disabled:opacity-40"
      >
        Add to Cart
      </button>

      {justAdded && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl bg-cream px-5 py-4">
          <span className="flex items-center gap-2 text-sm font-medium text-maroon">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-terracotta text-background">
              ✓
            </span>
            Added {lastAddedCount} to cart
          </span>
          <div className="flex shrink-0 items-center gap-4">
            <Link
              href="/shop"
              className="text-sm font-medium text-maroon/60 hover:text-maroon"
            >
              Keep shopping
            </Link>
            <Link
              href="/cart"
              className="rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-rust"
            >
              View Cart
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
