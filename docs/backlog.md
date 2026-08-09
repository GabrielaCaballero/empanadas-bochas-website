# Backlog / Future Improvements

Running list of things flagged for later — not scoped or scheduled yet, just captured so they don't get lost. Add context/decisions inline as items get refined; move to a PR description once actually picked up.

## 1. Prettier order confirmation emails

Currently sent from `orders@empanadasbochas.com` (src/lib/email.ts), built as
plain HTML strings in src/lib/order-summary.ts. Wants:

- Add the logo / a food photo to the email template
- Better visual breakdown of the order (currently a flat `<ul>`)
- Consider generating a PDF receipt as an attachment

## 2. Rework checkout to unify fulfillment method + details (Di Blu Bakery reference)

Reference: [diblubakery.com](https://www.diblubakery.com/) checkout. Screenshot
shared shows an order summary with a single dropdown combining every
fulfillment option inline — each with its date/time and price baked in, e.g.:

- "Manhattan 08/15 — $20.00" (Saturday 08/15, 10am–1pm)
- "Custom Date - 600 Newark St..." (a delivery address)
- "Pick-up 08/15 Hoboken 9am..."
- "Pick-up 08/14 Hoboken 11am..."

Today's checkout (src/components/CheckoutClient.tsx) makes the customer pick a
mode first via three separate tab-like buttons (Pickup at an Event / Pickup at
Our Kitchen / Delivery), *then* fill in details. The ask is to flip this:
let people fill in details and the fulfillment options present more like a
single combined picker — "Deliver to..." (enter an address, price calculated
per address) or "Pick up at..." (lists upcoming events pulled from the events
sheet, plus kitchen pickup TBC over WhatsApp).

Open question worth resolving before building: delivery currently has **no
live price calculation** — the business owner manually quotes a fee after
receiving the request (see docs/PRD.md, Checkout section). Doing this
Di-Blu-style implies calculating a delivery price per address up front, which
is a real scope decision (flat zones? distance-based? still manual but
surfaced differently?) — needs a decision before implementation, not just a
UI change.

## 3. "My Orders" — anonymous checkout + a real privacy problem

Two issues bundled together:

**a. No accounts, but still want order history.** Site has no login/accounts
(explicit non-goal in docs/PRD.md v1). Common e-commerce workaround: guest
checkout, but the order confirmation *is* the "my orders" view for that
purchase — no separate lookup needed for the person who just paid, since
they land there right after Square redirects back
(src/app/checkout/success/page.tsx already does this today).

**b. Privacy problem with the current /orders page.** Right now anyone can
type in *any* email address on /orders and see that person's order history
(src/app/api/orders/lookup/route.ts → src/lib/square.ts `getOrdersByEmail`) —
if you know someone's email, you can see what they ordered. This needs
fixing, not just polishing. Options to consider:

- Drop the general-purpose /orders lookup page and its nav entry entirely;
  rely on the post-checkout confirmation page + the confirmation email as
  the only "receipt," each order's confirmation email could include a
  private link back to that specific order (signed/token-based, not a bare
  email lookup)
- Or gate /orders behind some lightweight verification (e.g. emailing a
  one-time link/code to prove you own that inbox before showing results)

Testing note: verifying whichever flow gets built will probably mean
switching Square back to sandbox credentials temporarily, since real orders
now hit production (see the square-production PR).

## 4. Cart icon

Prefers a classic shopping-cart icon over the current basket/bag icon in the
nav (src/components/Navbar.tsx, `CartIcon` component). Straightforward swap
whenever picked up.

## 5. Empty cart state needs a path back into shopping

src/components/CartClient.tsx currently just shows "Your cart is empty" + one
generic "Shop the Menu" link. Wants a "ghost" suggestion card (e.g. the Box of
12 empanadas) and more/easier links into the shop, so people don't hit a dead
end.

## 6. Cart page visual redesign

Feedback: the cart page doesn't look good, and the "Add to Cart / Continue
Shopping" pattern (currently the confirmation banner shown on the PDP after
adding an item, src/components/AddToCart.tsx) isn't quite right either — worth
double-checking during scoping whether this is about that PDP banner
specifically or the cart page's own flow, since both got mentioned together.
Concretely wants:

- Product images on cart line items (currently text-only — no photo per line)
- A general look at how established e-commerce sites structure their cart
  page and borrow from that, rather than the current bespoke layout
- Overall priority: keep choosing + checking out as fast and simple as
  possible — redesign shouldn't add friction in the name of polish

## 7. Site favicon — how to change it

Not a bug, just documenting the answer so it doesn't need re-explaining:
the icon shown in the browser tab, Chrome history, and address-bar
autocomplete when typing the site name is the favicon, controlled entirely
by the Next.js app (`src/app/favicon.ico`) — Vercel has nothing to do with
it. To change it, replace that file (or add `icon.png` / `icon.svg`
alongside it for more control over sizes) — Next.js's file-based convention
picks it up automatically, no code change needed. After deploying, browsers
and Chrome history can keep showing the old cached icon for a while, so a
delay before it updates everywhere is normal.

## 8. Events calendar: default month + empty-month state

Two related gaps in src/components/EventsCalendar.tsx:

**a. Default month isn't always "today."** The calendar's initial
`viewYear`/`viewMonth` are derived from the *first upcoming event*
(`selected`), not from today's actual date:

```ts
const [viewYear, setViewYear] = useState(
  selected ? Number(selected.date.slice(0, 4)) : now.getFullYear(),
);
const [viewMonth, setViewMonth] = useState(
  selected ? Number(selected.date.slice(5, 7)) - 1 : now.getMonth(),
);
```

This looks right whenever the next event happens to fall in the current
month (the common case so far), but if there's a gap — say all of this
month's stops already happened and the next one isn't until two months out
— landing on the page would jump straight to that future month instead of
showing the current month first. Should default to today's real month
regardless of where events happen to fall, letting people navigate forward
themselves.

**b. No empty-month messaging.** If the viewed month has zero events (e.g.
September before any September dates have been added to the sheet), the
grid just renders with nothing highlighted — no "no stops posted for this
month yet" type message. Worth adding some empty state, especially since
(a) means people could land on a genuinely empty month by default.
