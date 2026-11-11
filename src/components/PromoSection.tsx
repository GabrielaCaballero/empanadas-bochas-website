import Link from "next/link";
import {
  isPromoActive,
  PROMO_NAME,
  PROMO_THROUGH_LABEL,
} from "@/lib/promotions";

// The deals as customers read them. The rules themselves live in
// lib/promotions.ts; this is only the wording.
const DEALS = [
  {
    icon: "🦃",
    title: "10% off the Box of 12",
    body: "Our biggest box, 10% off. Replaces the usual “2 free” while the sale lasts.",
    href: "/shop?type=savory",
    cta: "Shop empanadas",
  },
  {
    icon: "🎁",
    title: "Free alfajor with a Box of 6",
    body: "Every Box of 6 comes with a free alfajor. Pick your flavor in the cart.",
    href: "/shop?type=savory",
    cta: "Shop empanadas",
  },
  {
    icon: "🍪",
    title: "Buy 2 alfajores, get 1 free",
    body: "Shortbread, Chocolate, or one of each. Every third alfajor is free.",
    href: "/shop?type=sweet",
    cta: "Shop alfajores",
  },
];

// Short one-line version of the deals, for the Shop page.
export function PromoStrip() {
  if (!isPromoActive()) return null;
  return (
    <div className="mt-3 rounded-2xl border border-terracotta/30 bg-terracotta/10 px-4 py-3">
      <p className="text-sm font-bold uppercase tracking-wide text-terracotta">
        ⏳ Limited time promotions
        <span className="ml-2 font-medium normal-case tracking-normal text-maroon/70">
          {PROMO_NAME} specials, through {PROMO_THROUGH_LABEL}
        </span>
      </p>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium text-maroon">
        {DEALS.map((d) => (
          <li key={d.title}>
            <span aria-hidden="true">{d.icon}</span> {d.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

// The home page block: the same three deals as cards.
export default function PromoSection() {
  if (!isPromoActive()) return null;
  return (
    <section className="bg-terracotta/10 px-6 py-10 sm:px-12 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-bold uppercase tracking-wide text-terracotta">
          ⏳ Limited time promotions
        </p>
        <h2 className="mt-1 font-display text-3xl font-semibold text-maroon sm:text-4xl">
          {PROMO_NAME} specials
        </h2>
        <p className="mt-2 text-maroon/70">Through {PROMO_THROUGH_LABEL}.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {DEALS.map((d) => (
            <Link
              key={d.title}
              href={d.href}
              className="group flex flex-col rounded-3xl bg-background p-6 shadow-sm ring-1 ring-terracotta/20 transition-shadow hover:shadow-lg"
            >
              <span className="text-3xl" aria-hidden="true">
                {d.icon}
              </span>
              <h3 className="mt-3 font-display text-xl font-semibold text-maroon">
                {d.title}
              </h3>
              <p className="mt-2 flex-1 text-sm text-maroon/70">{d.body}</p>
              <span className="mt-4 text-sm font-semibold text-terracotta group-hover:text-rust">
                {d.cta} →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
