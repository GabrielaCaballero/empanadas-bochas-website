"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/square";

type SauceVariation = {
  id: string;
  name: string;
  priceCents: number;
};

export default function CartClient({
  sauceVariations,
}: {
  sauceVariations: SauceVariation[];
}) {
  const {
    items,
    removeItem,
    updateQuantity,
    totalCents,
    sauces,
    setSauceCount,
    totalEmpanadaCount,
    freeSauceAllotment,
  } = useCart();

  const totalSaucesSelected = Object.values(sauces).reduce((a, b) => a + b, 0);
  const paidSauces = Math.max(0, totalSaucesSelected - freeSauceAllotment);
  const saucePriceCents = sauceVariations[0]?.priceCents ?? 0;
  const sauceCostCents = paidSauces * saucePriceCents;
  const grandTotalCents = totalCents + sauceCostCents;

  if (items.length === 0) {
    return (
      <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
        <h1 className="font-display text-4xl font-semibold text-maroon">
          Your cart
        </h1>
        <p className="mt-3 max-w-xl text-maroon/70">Your cart is empty.</p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-terracotta px-6 py-3 font-semibold text-background transition-colors hover:bg-rust"
        >
          Shop the Menu
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <h1 className="font-display text-4xl font-semibold text-maroon">
        Your cart
      </h1>
      <p className="mt-2 text-sm text-maroon/60">
        Want an odd number of empanadas? Add a combo and a few individual
        empanadas separately — they all add up in one cart.
      </p>

      <ul className="mt-10 flex flex-col gap-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-4 rounded-3xl bg-cream p-6"
          >
            <div>
              <h2 className="font-display text-lg font-semibold text-maroon">
                {item.name}
              </h2>

              {item.flavors ? (
                <ul className="mt-1 text-sm text-maroon/70">
                  {Object.entries(item.flavors)
                    .filter(([, count]) => count > 0)
                    .map(([flavor, count]) => (
                      <li key={flavor}>
                        {count}x {flavor}
                      </li>
                    ))}
                </ul>
              ) : (
                <div className="mt-2 flex items-center gap-2 text-sm text-maroon/70">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-maroon/30"
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-maroon/30"
                  >
                    +
                  </button>
                </div>
              )}
            </div>

            <div className="text-right">
              <p className="font-medium text-terracotta">
                {formatPrice(item.unitPriceCents * item.quantity)}
              </p>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="mt-2 text-sm text-maroon/50 hover:text-maroon"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      {totalEmpanadaCount > 0 && sauceVariations.length > 0 && (
        <div className="mt-10 rounded-2xl bg-cream p-6">
          <h2 className="font-display text-lg font-semibold text-maroon">
            Sauces
          </h2>
          <p className="mt-1 text-sm text-maroon/70">
            {freeSauceAllotment > 0
              ? `You've got ${freeSauceAllotment} free sauce${freeSauceAllotment > 1 ? "s" : ""} with ${totalEmpanadaCount} empanadas. Extra sauces are ${formatPrice(saucePriceCents)} each.`
              : `Add 3+ empanadas to unlock a free sauce. Sauces are ${formatPrice(saucePriceCents)} each.`}
          </p>

          <div className="mt-4 flex flex-col gap-2">
            {sauceVariations.map((variation) => (
              <div
                key={variation.id}
                className="flex items-center justify-between rounded-xl bg-background px-4 py-2"
              >
                <span className="text-maroon">{variation.name}</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setSauceCount(
                        variation.name,
                        (sauces[variation.name] ?? 0) - 1,
                      )
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-maroon/30 text-maroon"
                  >
                    −
                  </button>
                  <span className="w-4 text-center text-maroon">
                    {sauces[variation.name] ?? 0}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSauceCount(
                        variation.name,
                        (sauces[variation.name] ?? 0) + 1,
                      )
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-maroon/30 text-maroon"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalSaucesSelected > 0 && (
            <p className="mt-3 text-sm text-maroon/70">
              {totalSaucesSelected} sauce{totalSaucesSelected > 1 ? "s" : ""}{" "}
              selected — {Math.min(totalSaucesSelected, freeSauceAllotment)}{" "}
              free
              {paidSauces > 0 &&
                `, ${paidSauces} × ${formatPrice(saucePriceCents)} = ${formatPrice(sauceCostCents)}`}
            </p>
          )}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between text-lg font-semibold text-maroon">
        <span>Total</span>
        <span>{formatPrice(grandTotalCents)}</span>
      </div>

      <button
        type="button"
        className="mt-8 w-full rounded-full bg-terracotta px-6 py-3 font-semibold text-background transition-colors hover:bg-rust"
      >
        Checkout
      </button>
    </section>
  );
}
