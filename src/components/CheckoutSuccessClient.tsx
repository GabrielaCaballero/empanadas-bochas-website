"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/square";

function formatEventDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function CheckoutSuccessClient({
  customerName,
  customerEmail,
  venue,
  eventDate,
  eventTime,
  eventAddress,
  lineItems,
  totalCents,
}: {
  customerName: string;
  customerEmail: string;
  venue: string;
  eventDate: string;
  eventTime: string;
  eventAddress: string;
  lineItems: { name: string; quantity: string; note?: string }[];
  totalCents: number;
}) {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
    // Only ever run once, right after a confirmed order lands on this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <span className="text-4xl">🎉</span>
      <h1 className="mt-3 font-display text-4xl font-semibold text-maroon">
        Order confirmed!
      </h1>
      <p className="mt-3 text-maroon/70">
        Thanks, {customerName.split(" ")[0]} — we&rsquo;ve sent a confirmation
        to <strong>{customerEmail}</strong>.
      </p>

      <div className="mt-8 rounded-3xl bg-cream p-6">
        <p className="text-sm font-medium text-maroon/60">Pickup</p>
        <p className="mt-1 font-semibold text-maroon">{venue}</p>
        <p className="mt-1 text-sm text-maroon/70">
          {formatEventDate(eventDate)} · {eventTime}
        </p>
        <p className="mt-1 text-sm text-maroon/70">{eventAddress}</p>
      </div>

      <div className="mt-4 rounded-3xl bg-cream p-6">
        <p className="text-sm font-medium text-maroon/60">Order summary</p>
        <ul className="mt-2 flex flex-col gap-1 text-sm text-maroon/80">
          {lineItems.map((item, i) => (
            <li key={i}>
              {item.quantity}x {item.name}
              {item.note ? ` (${item.note})` : ""}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-maroon/10 pt-3 font-semibold text-maroon">
          <span>Total</span>
          <span>{formatPrice(totalCents)}</span>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/orders"
          className="rounded-full bg-terracotta px-6 py-3 font-semibold text-background transition-colors hover:bg-rust"
        >
          View My Orders
        </Link>
        <Link
          href="/shop"
          className="rounded-full border border-maroon/20 px-6 py-3 font-semibold text-maroon transition-colors hover:bg-maroon/5"
        >
          Continue Shopping
        </Link>
      </div>
    </section>
  );
}
