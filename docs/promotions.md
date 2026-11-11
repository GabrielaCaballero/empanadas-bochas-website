# Limited-time promotions

All promotion rules and dates live in **`src/lib/promotions.ts`**. Nothing else
needs editing to start, change, or stop a promotion.

## Current promotion: Thanksgiving (Nov 11 to Nov 30, 2026)

| Deal | How it works |
| --- | --- |
| 10% off the Box of 12 | $60.00 becomes $54.00. The usual "buy 12, get 2 free" is paused while it runs: customers pick **12** flavors, not 14. |
| Free alfajor with 6 empanadas | One free alfajor for every 6 empanadas in the order (boxes and singles count together; a Box of 12 earns 2). |
| Buy 2 alfajores, get 1 free | Every group of 3 alfajores has one free (the cheapest). Alfajores already free from the empanada deal don't count toward this one. |

The three deals can combine. The free-delivery threshold ($120) is measured on
the price **before** discounts, so a sale never costs anyone free delivery. Tax
is charged on the discounted amount.

## When it ends

`PROMO_END` is **exclusive** and in New York time: `2026-12-01T00:00:00-05:00`
means the sale runs through the last second of Nov 30. After that, with no code
change:

- the "Limited time promotions" section (home) and strip (shop) disappear
- badges and sale prices disappear
- the Box of 12 goes back to "14 empanadas for the 12 price" (`2 FREE`)
- the checkout stops adding discounts

Pages refresh themselves within 5 minutes of the end time.

## How it works

- **Shop, product pages:** show sale prices and badges (server-rendered from `isPromoActive()`).
- **Cart and checkout pages:** show the discounts live, using `applyPromotions()`.
- **Checkout API (`/api/checkout`):** recomputes the discounts on the server from
  the cart and sends them to Square as named order discounts
  (e.g. "Thanksgiving: 10% off Box of 12"). This is what customers are really
  charged; the browser only previews it. Square takes discounts off before
  computing tax.
- **Receipts:** the confirmation page, email, and PDF show each discount as its own line.

### Carts that span a promotion start or end

A Box of 12 added under one set of rules (12 flavors) and checked out under the
other (14) is flagged in the cart ("remove it and add it again") and rejected
by the checkout API, so nobody is charged a surprising amount.

## Starting a new promotion

1. Change `PROMO_NAME`, `PROMO_START`, `PROMO_END`, and `PROMO_THROUGH_LABEL`.
2. For different deals, edit the rules in `applyPromotions()` and the wording in
   `src/components/PromoSection.tsx` (the `DEALS` list).
3. Test with a few carts; the sandbox checkout (`SQUARE_CHECKOUT_ENV=sandbox`)
   shows exactly what Square would charge.

## Known limits

- Items are recognized **by name** ("alfajor", "box of 12"), like the rest of the
  shop, because the Square catalog has no categories. Renaming those items in
  Square could stop a deal from applying.
- The checkout API trusts the prices the cart sends (same as before promotions).
