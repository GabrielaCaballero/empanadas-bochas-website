"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/square";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalCents } = useCart();

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

      <ul className="mt-10 flex flex-col gap-6">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-4 border-b border-maroon/10 pb-6"
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

      <div className="mt-8 flex items-center justify-between text-lg font-semibold text-maroon">
        <span>Total</span>
        <span>{formatPrice(totalCents)}</span>
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
