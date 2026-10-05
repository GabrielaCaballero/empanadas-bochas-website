"use client";

import { FREE_DELIVERY_THRESHOLD_CENTS } from "@/lib/delivery-pricing";
import Link from "next/link";
import { formatPrice } from "@/lib/square";

// Nudges people toward the free-delivery threshold: a progress bar while
// they're under it ("Add $X more"), and a celebratory state once they've
// crossed it. Measured against the merchandise subtotal (before tax and
// delivery), the same number computeDeliveryFeeCents uses, so what it says
// always matches what checkout actually charges.
export default function FreeDeliveryProgress({
  subtotalCents,
}: {
  subtotalCents: number;
}) {
  const remaining = FREE_DELIVERY_THRESHOLD_CENTS - subtotalCents;
  const unlocked = remaining <= 0;
  const percent = Math.min(
    100,
    Math.round((subtotalCents / FREE_DELIVERY_THRESHOLD_CENTS) * 100),
  );
  const threshold = formatPrice(FREE_DELIVERY_THRESHOLD_CENTS)?.replace(".00", "");

  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        unlocked
          ? "border-green-200 bg-green-100"
          : "border-terracotta/30 bg-terracotta/10"
      }`}
    >
      <p
        className={`text-sm font-semibold ${
          unlocked ? "text-green-700" : "text-maroon"
        }`}
      >
        {unlocked ? (
          <>🚚 You&rsquo;ve unlocked free delivery!</>
        ) : (
          <>
            🚚 Add{" "}
            <span className="text-terracotta">{formatPrice(remaining)}</span>{" "}
            more for free delivery
          </>
        )}
      </p>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-maroon/10"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress toward free delivery"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            unlocked ? "bg-green-600" : "bg-terracotta"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {!unlocked && (
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p className="text-xs text-maroon/60">
            Free delivery on orders of {threshold} or more.
          </p>
          <Link
            href="/shop"
            className="text-sm font-semibold text-terracotta hover:text-rust"
          >
            Shop more →
          </Link>
        </div>
      )}
    </div>
  );
}
