// Limited-time promotions: the ONE place that knows what's on sale, when, and
// how each deal is calculated. Used by the shop (to show prices and badges),
// the cart and checkout pages (to show totals), and the checkout API (which
// is the source of truth for what Square actually charges).
//
// To run a new promotion, change the dates and names below. When the end date
// passes, every deal switches itself off: no code to remove, and the Box of
// 12 goes back to "14 empanadas for the 12 price". See docs/promotions.md.
//
// This file must stay free of React and server-only imports: it runs in the
// browser and on the server.

export const PROMO_NAME = "Thanksgiving";

// Both are America/New_York midnight (EST, UTC-5, since DST ended Nov 1).
// The end is EXCLUSIVE, so the sale runs through the last second of Nov 30.
export const PROMO_START = new Date("2026-11-11T00:00:00-05:00");
export const PROMO_END = new Date("2026-12-01T00:00:00-05:00");
// What the site says out loud ("through Nov 30"); keep in sync with PROMO_END.
export const PROMO_THROUGH_LABEL = "Nov 30";

export function isPromoActive(now: Date = new Date()): boolean {
  return now >= PROMO_START && now < PROMO_END;
}

// ---- The three deals ------------------------------------------------------

// 10% off the Box of 12. While it runs, the usual "buy 12, get 2 free" is
// paused (you pick 12 flavors, not 14), so the two never stack.
export const BOX_OF_12_DISCOUNT_RATE = 0.1;
export const BOX_OF_12_REGULAR_FLAVOR_COUNT = 14; // 12 + the 2 free
export const BOX_OF_12_PROMO_FLAVOR_COUNT = 12;

// 1 free alfajor with each Box of 6 (only the Box of 6: not the Box of 12,
// not boxes of 3, not singles).

// Buy 2 alfajores, get the 3rd free (every group of 3 has one free).
export const ALFAJORS_PER_FREE_GROUP = 3;

// ---- Cart math ------------------------------------------------------------

// The subset of a cart line the promos need. Both the browser cart
// (CartLineItem) and the checkout API request body fit this shape.
export type PromoLine = {
  id: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  flavors?: Record<string, number>;
};

export type PromoDiscount = { name: string; amountCents: number };

export type PromoResult = {
  active: boolean;
  // One entry per deal that applies; each becomes a discount on the Square order.
  discounts: PromoDiscount[];
  totalDiscountCents: number;
  // How much of the discount belongs to each cart line (by line id), for
  // showing "$5.00 -> Free" next to the line.
  lineDiscountCents: Record<string, number>;
  // Free alfajors earned (one per Box of 6) that aren't in the cart yet; the
  // cart offers a one-tap way to add them.
  unclaimedFreeAlfajors: number;
  // True when adding ONE more alfajor would make it free (buy 2, get 1).
  oneMoreAlfajorIsFree: boolean;
};

const NO_PROMO: PromoResult = {
  active: false,
  discounts: [],
  totalDiscountCents: 0,
  lineDiscountCents: {},
  unclaimedFreeAlfajors: 0,
  oneMoreAlfajorIsFree: false,
};

// Square's catalog has no categories, so items are recognized by name, the
// same way the shop already sorts Savory from Sweet (see catalog-sections.ts).
export function isAlfajorName(name: string): boolean {
  return /alfajor/i.test(name);
}
export function isBoxOf12Name(name: string): boolean {
  return /box of 12/i.test(name) && !isAlfajorName(name);
}
export function isBoxOf6Name(name: string): boolean {
  return /box of 6/i.test(name) && !isAlfajorName(name);
}

function flavorTotal(flavors?: Record<string, number>): number {
  if (!flavors) return 0;
  return Object.values(flavors).reduce((a, b) => a + b, 0);
}

// How many flavors a Box of 12 asks the customer to pick right now.
export function boxOf12FlavorCount(now: Date = new Date()): number {
  return isPromoActive(now)
    ? BOX_OF_12_PROMO_FLAVOR_COUNT
    : BOX_OF_12_REGULAR_FLAVOR_COUNT;
}

// A Box of 12 picked under one set of rules (14 flavors) but checked out
// under the other (12), or the reverse. Happens to carts that sit in the
// browser across the start or end of a promotion; the fix is to re-pick.
export function boxOf12NeedsReselect(
  line: PromoLine,
  now: Date = new Date(),
): boolean {
  return (
    isBoxOf12Name(line.name) &&
    flavorTotal(line.flavors) !== boxOf12FlavorCount(now)
  );
}

// Sale price of one Box of 12 (the list price minus 10%).
export function box12PromoPriceCents(listPriceCents: number): number {
  return listPriceCents - Math.round(listPriceCents * BOX_OF_12_DISCOUNT_RATE);
}

export function applyPromotions(
  lines: PromoLine[],
  now: Date = new Date(),
): PromoResult {
  if (!isPromoActive(now)) return NO_PROMO;

  const lineDiscountCents: Record<string, number> = {};
  const discounts: PromoDiscount[] = [];
  const addToLine = (id: string, cents: number) => {
    lineDiscountCents[id] = (lineDiscountCents[id] ?? 0) + cents;
  };

  // 1. 10% off Box of 12
  let box12Cents = 0;
  for (const line of lines) {
    if (!isBoxOf12Name(line.name)) continue;
    const cents = Math.round(
      line.unitPriceCents * line.quantity * BOX_OF_12_DISCOUNT_RATE,
    );
    box12Cents += cents;
    addToLine(line.id, cents);
  }
  if (box12Cents > 0) {
    discounts.push({
      name: `${PROMO_NAME}: 10% off Box of 12`,
      amountCents: box12Cents,
    });
  }

  // 2 + 3. Free alfajors. One unit per alfajor in the cart, cheapest first,
  // so the free ones are always the least expensive.
  const earnedFromEmpanadas = lines
    .filter((l) => isBoxOf6Name(l.name))
    .reduce((sum, l) => sum + l.quantity, 0);

  const alfajorUnits = lines
    .filter((l) => isAlfajorName(l.name))
    .flatMap((l) =>
      Array.from({ length: l.quantity }, () => ({
        id: l.id,
        priceCents: l.unitPriceCents,
      })),
    )
    .sort((a, b) => a.priceCents - b.priceCents);

  // The empanada deal uses up alfajors first; whatever is left over counts
  // toward "buy 2, get 1".
  const freeFromEmpanadas = Math.min(earnedFromEmpanadas, alfajorUnits.length);
  const remaining = alfajorUnits.length - freeFromEmpanadas;
  const freeFromGroups = Math.floor(remaining / ALFAJORS_PER_FREE_GROUP);

  let empanadaDealCents = 0;
  let groupDealCents = 0;
  alfajorUnits.slice(0, freeFromEmpanadas).forEach((u) => {
    empanadaDealCents += u.priceCents;
    addToLine(u.id, u.priceCents);
  });
  alfajorUnits
    .slice(freeFromEmpanadas, freeFromEmpanadas + freeFromGroups)
    .forEach((u) => {
      groupDealCents += u.priceCents;
      addToLine(u.id, u.priceCents);
    });

  if (empanadaDealCents > 0) {
    discounts.push({
      name: `${PROMO_NAME}: free alfajor with Box of 6`,
      amountCents: empanadaDealCents,
    });
  }
  if (groupDealCents > 0) {
    discounts.push({
      name: `${PROMO_NAME}: buy 2 alfajores, get 1 free`,
      amountCents: groupDealCents,
    });
  }

  return {
    active: true,
    discounts,
    totalDiscountCents: discounts.reduce((s, d) => s + d.amountCents, 0),
    lineDiscountCents,
    unclaimedFreeAlfajors: earnedFromEmpanadas - freeFromEmpanadas,
    oneMoreAlfajorIsFree: remaining % ALFAJORS_PER_FREE_GROUP === 2,
  };
}
