# Backlog / Future Improvements

Running list of things flagged for later — not scoped or scheduled yet, just captured so they don't get lost. Add context/decisions inline as items get refined; move to a PR description once actually picked up.

## 1. Prettier order confirmation emails

Currently sent from `orders@empanadasbochas.com` (src/lib/email.ts), built as
plain HTML strings in src/lib/order-summary.ts. Wants:

- Add the logo / a food photo to the email template
- Better visual breakdown of the order (currently a flat `<ul>`)
- ~~Consider generating a PDF receipt as an attachment~~ — done: customer
  confirmation emails now attach a PDF receipt (src/lib/order-pdf.ts).

## 2. Cart icon

Prefers a classic shopping-cart icon over the current basket/bag icon in the
nav (src/components/Navbar.tsx, `CartIcon` component). Straightforward swap
whenever picked up.

## 3. Site favicon — how to change it

Not a bug, just documenting the answer so it doesn't need re-explaining:
the icon shown in the browser tab, Chrome history, and address-bar
autocomplete when typing the site name is the favicon, controlled entirely
by the Next.js app (`src/app/favicon.ico`) — Vercel has nothing to do with
it. To change it, replace that file (or add `icon.png` / `icon.svg`
alongside it for more control over sizes) — Next.js's file-based convention
picks it up automatically, no code change needed. After deploying, browsers
and Chrome history can keep showing the old cached icon for a while, so a
delay before it updates everywhere is normal.

## 4. Events calendar: default month + empty-month state

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
