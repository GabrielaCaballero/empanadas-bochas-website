"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import type { CatalogItem } from "@/lib/square";

export default function AddToCart({ item }: { item: CatalogItem }) {
  const { addItem } = useCart();
  const price = item.variations[0]?.priceCents ?? 0;
  const variationId = item.variations[0]?.id ?? "";
  const required = item.requiredFlavorCount ?? 0;
  const hasFlavors = Boolean(item.flavors?.length && required > 0);

  const [flavorCounts, setFlavorCounts] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const totalFlavorsSelected = Object.values(flavorCounts).reduce(
    (a, b) => a + b,
    0,
  );
  const canAdd = hasFlavors ? totalFlavorsSelected === required : true;

  function changeFlavor(flavor: string, delta: number) {
    setFlavorCounts((prev) => {
      const current = prev[flavor] ?? 0;
      if (delta > 0 && totalFlavorsSelected >= required) return prev;
      return { ...prev, [flavor]: Math.max(0, current + delta) };
    });
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
    setAdded(true);
    setFlavorCounts({});
    setQuantity(1);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div>
      {hasFlavors ? (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-maroon/60">
            Choose your flavors ({totalFlavorsSelected}/{required})
          </h2>
          <div className="mt-3 flex flex-col gap-2">
            {item.flavors!.map((flavor) => (
              <div
                key={flavor}
                className="flex items-center justify-between rounded-xl bg-cream px-4 py-2"
              >
                <span className="text-maroon">{flavor}</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => changeFlavor(flavor, -1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-maroon/30 text-maroon"
                  >
                    −
                  </button>
                  <span className="w-4 text-center text-maroon">
                    {flavorCounts[flavor] ?? 0}
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
            ))}
          </div>
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
        {added ? "Added!" : "Add to Cart"}
      </button>
    </div>
  );
}
