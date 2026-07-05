# Empanadas Bochas — Product Requirements

## Background

Empanadas Bochas is a small NYC empanada business (Argentine-style, "Homemade ARG · NYC"). Today it only has an [Instagram presence](https://www.instagram.com/empanadasbochas/) — no website. The business:

- Sells at breweries and pop-up events around NYC.
- Takes custom orders delivered via Uber.
- Already uses **Square** for her product catalog and payments.

The design/UX reference is [diblubakery.com](https://www.diblubakery.com/) (itself built on Wix — used only as a style/content reference, not a platform choice).

## Goals

Build a website that:

1. Looks and feels like a real, professional small-batch bakery brand (matching the Di Blu reference in polish, not necessarily in feature count).
2. Lets customers browse the menu, find out where to pick up empanadas this week, and place orders — without the business owner needing to touch code.
3. Is small enough in scope to actually ship, given the business has no physical storefront.
4. Doubles as a learning project — built collaboratively on GitHub rather than through a no-code builder.

## Non-goals (v1)

- Gift cards
- Customer accounts / saved addresses
- Loyalty programs / promo codes
- Live/automated delivery-fee calculation (handled manually for now, see Checkout below)
- Multi-location / storefront features (Di Blu has two physical shops; Bochas does not)

## Tech stack

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript + Tailwind CSS v4 | Modern, well-documented, good fit for a GitHub-based learning project |
| Hosting | Vercel (free tier) | Zero-cost, auto-deploys from GitHub |
| Payments | Square Checkout API (generates itemized, hosted payment links server-side) | Business already uses Square; avoids handling card data directly (PCI) |
| Product catalog | Square Catalog API (live sync) | Owner updates products/prices only in Square, site reflects it automatically |
| Order/delivery emails | [Resend](https://resend.com) (free tier) | Simple transactional email from a Next.js API route |
| Events data | Google Sheet, published-to-web as CSV, fetched and parsed server-side | Non-technical, spreadsheet-based maintenance; **not** embedded as a raw sheet — the UI is fully custom-built from the parsed rows |

Considered and rejected: Square Online, Wix/Squarespace (both no-code — would give up the GitHub-collaboration/learning goal); pulling events live from Instagram (API requires Business/app review, fragile).

## Site map

- **Home** — hero, brand story snippet, links into Shop and Events
- **Shop** — full menu/product catalog (from Square Catalog API)
- **Product detail page (PDP)** — single item, variants, "related products" section (like Di Blu's PDPs)
- **Upcoming Events** — this month's brewery/pop-up stops
- **Cart / Checkout**
- **Contact**

## Upcoming Events page

Each event/stop shows: venue name, address (with map), date/time, the venue's Instagram, and an "Add to calendar" action.

**Data source:** the business owner maintains a Google Sheet (columns: date, time, venue name, address, Instagram link). It's published-to-web as a CSV URL (no login or API key needed). The site fetches and parses that CSV server-side and renders it with fully custom-designed cards/list — visitors never see anything resembling a spreadsheet.

## Checkout

No live storefront and delivery is via Uber (variable cost by distance), so checkout branches into three paths rather than a single generic flow:

1. **Pickup — at an event.** Customer picks one of the scheduled stops from the Events data and pays immediately. Implemented by calling Square's Checkout API server-side (not a manually pre-made static link) so the resulting Square Order is itemized with real line items and a note (e.g. "Pickup: [venue], [date]"). This is what makes the order traceable — a static link has no item/pickup context.
2. **Pickup — at her kitchen** (45-21 45th Street, Long Island City, NY 11104). No online payment; a WhatsApp "click to chat" link (`wa.me/19178303570?text=...`, prefilled with an order summary) lets the customer message the business directly to arrange pickup and payment.
3. **Delivery.** Customer submits an order + address + preferred date via a form (no payment collected yet). This mirrors Di Blu's own fallback for non-standard delivery: they manually quote a fee and send a payment link. Here, the business owner receives an email with the order, calculates the Uber delivery cost herself, and sends the customer a Square Checkout Link to pay.

**Order tracking:** Square Dashboard → Orders is the system of record (same place the owner already checks for sales) for paid orders. In addition, every order/request (all three paths) triggers an automatic email via Resend:
- To the business inbox (`empanadasbochas@gmail.com`) — a quick-glance summary of what/when/where, so she doesn't have to dig through Square's UI to know what to prep.
- To the customer — an order confirmation/summary, for every checkout path (not just delivery).

## Brand

- Logo and 5-color palette (sampled from `Images/2.png`):
  - Maroon `#3C1214`
  - Rust brown `#7E3023`
  - Terracotta `#C75F3A`
  - Dusty blue `#8EAED7`
  - Cream `#EECBA5`
- Source brand assets (logo variants, palette reference, product photography) live in `Images/` at the repo root; only what's actually used by the app is copied into `public/brand/`.

## Business contact details

- Email: `empanadasbochas@gmail.com`
- Phone / WhatsApp: `+1 (917) 830-3570`
- Fixed pickup address: 45-21 45th Street, Long Island City, NY 11104, USA

## Open items

- Confirm exact Google Sheet columns/format once the owner sets it up.
- Decide whether delivery-fee automation is worth adding in a later version.
