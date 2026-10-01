# Checkout: known edge cases, root causes, and fixes

Working notes from investigating a real bug report ("got an opaque 'Could
not create payment link' error") and then auditing the rest of the
checkout path for similar issues. Each item below is either **Fixed** (in
this repo already) or **Documented** (understood, not worth fixing yet —
with a note on why and what the fix would look like).

## Fixed

### 1. Incomplete email passes client validation, fails opaquely at Square

**Symptom:** typing an email missing its domain (e.g. `name@gmail` instead
of `name@gmail.com`) passed the form and produced a bare "Could not create
payment link" with no explanation.

**Root cause:** `<input type="email">` does **not** require a dot after the
`@` per the HTML spec — `name@gmail` is "valid enough" to submit. Square's
API does require a real domain and rejected it with `INVALID_EMAIL_ADDRESS`
on `pre_populated_data.buyer_email`, but the old code discarded that detail
and always returned the same generic message.

**Fix:**
- A stricter regex (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) is checked in three
  layers: the input's `pattern` attribute (native browser validation), a JS
  check in `CheckoutClient.handlePaidSubmit` (instant feedback, no
  round-trip), and again server-side in `/api/checkout` (so the check holds
  even if JS/native validation is bypassed).
- `SquareApiError` (`src/lib/square.ts`) now parses Square's structured
  error body instead of swallowing it into one string, so a genuinely novel
  Square-side email rejection (not caught by the regex above) still gets a
  specific message via `isEmailError()` rather than a generic one.

### 2. Checkout errors had no path back to the business

**Symptom:** any checkout failure just showed red text with no next step.

**Fix:** every checkout error (`CheckoutClient.tsx`) now shows a "Message
us on WhatsApp" button alongside the error text, pre-filled with the actual
error message so the business owner has context without the customer
needing to describe it. This matches the pattern `CartClient.tsx` already
used for the `?error=order` banner.

### 3. The post-payment order lookup could occasionally resolve the wrong order

**Symptom:** not reported by the user, found while investigating the error
above — not a visible bug today, but a real one waiting to happen.

**Root cause:** Square's hosted checkout redirect does **not** append an
order ID (confirmed — Payment Links' `checkout_options.redirect_url` is
passed through as-is with no params added). The old code worked around
this by searching Square's `/v2/orders/search` for a **recent order with a
matching total**, taking the first (most recent) result
(`findRecentMatchingOrder`). Two problems with that:

  - `/v2/orders/search` has a real eventual-consistency lag — a
    just-created order can be invisible to search for several seconds even
    with zero filters (confirmed directly against the sandbox API in an
    earlier debugging session), while a direct `GET /v2/orders/{id}` sees
    it immediately.
  - Worse: it doesn't verify the order belongs to *this* checkout at all —
    just that *some* recent order has the same total. **Two different
    customers checking out around the same time for the same amount (e.g.
    two people each buying "1 Empanada" at $6.25) can collide**, and the
    wrong customer's order details would be used for the confirmation
    email and receipt PDF.

**Fix:** the Square order's own ID is now threaded through end-to-end:
  1. `createPaymentLink` (`src/lib/square.ts`) creates the payment link
     *without* a `redirect_url` — Square still assigns the order an ID as
     part of this call.
  2. That ID is encoded into `CheckoutContext` (`orderId`), which becomes
     part of the redirect URL.
  3. `setPaymentLinkRedirect` (a second, small API call) attaches the
     redirect URL to the already-created payment link —
     `PUT /v2/online-checkout/payment-links/{id}` with the link's
     `version`. Confirmed working directly against the sandbox API.
  4. `/checkout/success` now calls `getOrderById(ctx.orderId)` first — a
     direct, strongly-consistent lookup, not a guess. The old
     `findRecentMatchingOrder` path is kept only as a fallback for a ctx
     blob encoded before this existed, or a transient failure on the
     direct lookup itself.

  Verified end-to-end in the sandbox: created a payment link, completed a
  real test payment via Square's sandbox panel, and confirmed the redirect
  landed on the correct order with accurate line items and total.

  **A non-obvious Square API constraint discovered while building this:**
  Payment Links' `order` field does **not** support referencing a
  pre-existing order — passing `order: { id: "...", location_id, ... }`
  is rejected with *"Read-only field is calculated and cannot be set by a
  client"* on `order.id`, even with a full line-items body attached. The
  only way to attach a redirect URL to a link whose order ID you need in
  advance is create-then-update, as implemented above — not create the
  order separately first (`POST /v2/orders` then reference it), which
  seemed like the obvious approach but isn't supported by this endpoint.

## Documented, not fixed (lower priority / bigger lift)

### 4. The total+recency fallback is still theoretically collision-prone

Now only used when `getOrderById` fails or `ctx.orderId` is missing (an
old in-flight link), so the practical exposure is much smaller than before
— but if it *does* trigger, the same two-customers-same-total collision
risk from #3 still applies. The fully robust fix is **Square webhooks**
(`order.updated` / `payment.updated`, confirmed fired on a real sandbox
payment) instead of guessing from a redirect at all — but that needs a
webhook endpoint, signature verification, and somewhere to persist order
state until the customer's browser gets back to `/checkout/success`, which
this app doesn't have (no database). Worth revisiting if order volume
grows enough that same-total collisions become plausible.

### 5. Missing/misconfigured Square credentials

`checkoutCredentials()` throws `"Missing Square sandbox/production
credentials"` if the relevant env vars aren't set. This is an ops/config
error, not a customer-facing one — it's already logged clearly
server-side, and the customer sees the same generic error + WhatsApp
fallback as any other checkout failure. No change needed; just noting it's
covered by the fallback rather than a silent failure.

### 6. Double-submitting "Pay Now"

Each submit generates a fresh `idempotency_key`, so clicking twice quickly
(before `submitting` disables the button) could create two separate draft
orders/payment links. Low-impact (unpaid draft orders don't cost anything
and don't get confirmed/emailed unless actually paid), and the button
already disables itself once `submitting` is true. Not worth more
guarding given how rarely this would actually produce two real payments.

### 7. Re-visiting `/checkout/success` after it already ran once

Refreshing the success page, or revisiting it from browser history, re-runs
the whole page including both confirmation emails. The **business**
email re-sends; the **customer** email usually gets rejected by Resend
with `invalid_idempotent_request` (idempotency key reused with different
request content — likely because the generated PDF receipt isn't
byte-identical between runs). This is logged but swallowed
(`console.error`, no customer-facing error), which is the right behavior —
the customer already got their real confirmation on the first visit, and
a revisit silently not re-sending it is better than erroring on a page
that otherwise displays correctly either way.
