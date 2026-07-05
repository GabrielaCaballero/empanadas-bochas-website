"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import type { CatalogItem } from "@/lib/square";
import { flavorInfo } from "@/lib/flavor-info";

export default function AddToCart({ item }: { item: CatalogItem }) {
  const { addItem } = useCart();
  const price = item.variations[0]?.priceCents ?? 0;
  const variationId = item.variations[0]?.id ?? "";
  const required = item.requiredFlavorCount ?? 0;
  const hasFlavors = Boolean(item.flavors?.length && required > 0);

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
    addItem({
      itemId: item.id,
      variationId,
      name: item.name.trim(),
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
            <h2 className="text-sm font-medium text-maroon/60">
              Choose your flavors
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
        <div className="mt-8 flex items-center gap-3">
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
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-cream px-4 py-3 text-sm">
          <span className="text-maroon">
            ✓ Added {lastAddedCount} to cart
          </span>
          <Link
            href="/cart"
            className="font-semibold text-terracotta hover:text-rust"
          >
            View Cart
          </Link>
          <Link
            href="/shop"
            className="font-semibold text-maroon hover:text-terracotta"
          >
            Continue Shopping
          </Link>
        </div>
      )}
    </div>
  );
}
