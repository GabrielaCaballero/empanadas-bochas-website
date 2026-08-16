"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/square";
import { whatsAppUrl, PICKUP_ADDRESS } from "@/lib/business-info";
import type { CheckoutContext } from "@/lib/checkout-context";

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
  fulfillment,
  lineItems,
  totalCents,
}: {
  customerName: string;
  customerEmail: string;
  fulfillment: CheckoutContext["fulfillment"];
  lineItems: {
    name: string;
    quantity: string;
    note?: string;
    totalCents: number;
  }[];
  totalCents: number;
}) {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
    // Only ever run once, right after a confirmed order lands on this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleMessage = `Hi! I just paid for pickup at your kitchen:\n${lineItems
    .filter((item) => !item.name.startsWith("Pickup:"))
    .map((item) => `${item.quantity}x ${item.name}`)
    .join("\n")}\nTotal: ${formatPrice(totalCents)}\n\nWhen can I pick it up?`;

  return (
    <section className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <span className="text-4xl">🎉</span>
      <h1 className="mt-3 font-display text-4xl font-semibold text-maroon">
        Order confirmed!
      </h1>
      <p className="mt-3 text-maroon/70">
        Thanks, {customerName.split(" ")[0]} — we&rsquo;ve emailed your
        receipt to <strong>{customerEmail}</strong>.
      </p>

      <div className="mt-8 rounded-3xl bg-cream p-6">
        {fulfillment.kind === "event" ? (
          <>
            <p className="text-sm font-medium text-maroon/60">Pickup</p>
            <p className="mt-1 font-semibold text-maroon">
              {fulfillment.venue}
            </p>
            <p className="mt-1 text-sm text-maroon/70">
              {formatEventDate(fulfillment.eventDate)} · {fulfillment.eventTime}
            </p>
            <p className="mt-1 text-sm text-maroon/70">
              {fulfillment.eventAddress}
            </p>
          </>
        ) : fulfillment.kind === "kitchen" ? (
          <>
            <p className="text-sm font-medium text-maroon/60">Pickup</p>
            <p className="mt-1 font-semibold text-maroon">Our Kitchen</p>
            <p className="mt-1 text-sm text-maroon/70">{PICKUP_ADDRESS}</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-maroon/60">Delivery</p>
            <p className="mt-1 font-semibold text-maroon">
              {fulfillment.address}
            </p>
            <p className="mt-1 text-sm text-maroon/70">
              {fulfillment.neighborhood}, {fulfillment.borough}
            </p>
            <p className="mt-1 text-sm text-maroon/70">
              Delivery fee:{" "}
              {fulfillment.feeCents === 0 ? (
                <span className="font-bold text-green-600">Free</span>
              ) : (
                formatPrice(fulfillment.feeCents)
              )}
            </p>
          </>
        )}
      </div>

      {fulfillment.kind === "kitchen" && (
        <div className="mt-4 rounded-3xl bg-cream p-6">
          <p className="text-maroon/70">
            Now let&rsquo;s schedule a pickup time — message us on WhatsApp
            and we&rsquo;ll confirm directly with you.
          </p>
          <a
            href={whatsAppUrl(scheduleMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block w-fit rounded-full bg-terracotta px-6 py-3 font-semibold text-background transition-colors hover:bg-rust"
          >
            Message on WhatsApp
          </a>
        </div>
      )}

      <div className="mt-4 rounded-3xl bg-cream p-6">
        <p className="text-sm font-medium text-maroon/60">Order summary</p>
        <ul className="mt-2 flex flex-col gap-1.5 text-sm text-maroon/80">
          {lineItems.map((item, i) => (
            <li key={i} className="flex items-baseline justify-between gap-3">
              <span>
                {item.quantity}x {item.name}
                {item.note ? ` (${item.note})` : ""}
              </span>
              <span className="shrink-0 text-maroon/60">
                {item.totalCents === 0 ? "Free" : formatPrice(item.totalCents)}
              </span>
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
          href="/shop"
          className="rounded-full bg-terracotta px-6 py-3 font-semibold text-background transition-colors hover:bg-rust"
        >
          Continue Shopping
        </Link>
      </div>
    </section>
  );
}
