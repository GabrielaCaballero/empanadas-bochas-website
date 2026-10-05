import { NextResponse } from "next/server";
import {
  createPaymentLink,
  setPaymentLinkRedirect,
  SquareApiError,
} from "@/lib/square";
import { buildSquareLineItems } from "@/lib/order-summary";
import { getUpcomingEvents } from "@/lib/events";
import { getDeliveryZones, computeDeliveryFeeCents } from "@/lib/delivery-pricing";
import { encodeCheckoutContext, type CheckoutContext } from "@/lib/checkout-context";
import { PICKUP_ADDRESS } from "@/lib/business-info";
import type { CartLineItem } from "@/lib/cart-context";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { formatWeekendDate } from "@/lib/weekend-dates";
import { getWeekendOptions } from "@/lib/availability";

type Fulfillment =
  | { kind: "event"; eventDate: string; venue: string }
  | { kind: "kitchen"; date: string }
  | { kind: "delivery"; zoneId: string; address: string; date: string };

type RequestBody = {
  items: CartLineItem[];
  totalCents: number; // grand total BEFORE any delivery fee
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  fulfillment: Fulfillment;
};

export async function POST(request: Request) {
  // Creates a real Square order even on a failed/incomplete submission, so
  // this guards against a script hammering the endpoint — no charge happens
  // until the buyer actually pays, but each call still litters the Square
  // dashboard with a draft order and spends API quota.
  const { allowed, retryAfterSeconds } = checkRateLimit(
    `checkout:${getClientIp(request)}`,
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many checkout attempts — please wait a moment and try again." },
      {
        status: 429,
        headers: retryAfterSeconds
          ? { "Retry-After": String(retryAfterSeconds) }
          : undefined,
      },
    );
  }

  const body: RequestBody = await request.json();
  const {
    items,
    totalCents,
    customerName,
    customerEmail,
    customerPhone,
    fulfillment,
  } = body;

  if (!items?.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }
  if (!customerName || !customerEmail || !customerPhone) {
    return NextResponse.json(
      { error: "Missing customer contact info" },
      { status: 400 },
    );
  }
  // Catches an incomplete address (e.g. "name@gmail" with no ".com") before
  // it ever reaches Square — the native <input type="email"> the client
  // uses does NOT require a dot after the @ per the HTML spec, so a
  // address that's "valid enough" to submit the form can still be one
  // Square's own API rejects, which used to surface only as an opaque
  // "Could not create payment link" with no indication of why.
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!EMAIL_RE.test(customerEmail.trim())) {
    return NextResponse.json(
      {
        error:
          "That email address looks incomplete — please include a domain, like name@example.com.",
      },
      { status: 400 },
    );
  }

  const lineItems = buildSquareLineItems(items);

  let ctxFulfillment: CheckoutContext["fulfillment"];

  if (fulfillment.kind === "event") {
    // Re-fetched and matched server-side rather than trusting the client's
    // event data directly — the client only ever sends back a date+venue it
    // saw in the picker. Matched on both fields since two events can share a
    // date (different venues).
    const events = await getUpcomingEvents();
    const event = events.find(
      (e) => e.date === fulfillment.eventDate && e.venue === fulfillment.venue,
    );
    if (!event) {
      return NextResponse.json({ error: "Unknown event" }, { status: 400 });
    }

    lineItems.push({
      name: `Pickup: ${event.venue}, ${event.date}`,
      quantity: 1,
      unitPriceCents: 0,
    });

    ctxFulfillment = {
      kind: "event",
      venue: event.venue,
      eventDate: event.date,
      eventTime: event.time,
      eventAddress: event.address,
    };
  } else if (fulfillment.kind === "kitchen") {
    // Re-validated server-side — never trust a client-sent date. Same
    // rules the day picker uses (weekend, not closed in the sheet, no
    // pop-up that day), via the one shared getWeekendOptions().
    const day = (await getWeekendOptions()).find((o) => o.date === fulfillment.date);
    if (!day?.kitchen.available) {
      return NextResponse.json(
        {
          error:
            "Kitchen pickup isn't available on that day — please choose another weekend day, or pick up at a pop-up event.",
        },
        { status: 400 },
      );
    }
    lineItems.push({
      name: `Pickup: Our Kitchen, ${PICKUP_ADDRESS} — ${formatWeekendDate(fulfillment.date)}`,
      quantity: 1,
      unitPriceCents: 0,
    });

    ctxFulfillment = {
      kind: "kitchen",
      date: fulfillment.date,
      hours: day.kitchen.hours,
    };
  } else {
    if (!fulfillment.address) {
      return NextResponse.json(
        { error: "Missing delivery address" },
        { status: 400 },
      );
    }

    // Re-fetched and matched server-side — never trust a client-sent price.
    const zones = await getDeliveryZones();
    const zone = zones.find((z) => z.id === fulfillment.zoneId);
    if (!zone) {
      return NextResponse.json(
        { error: "Unknown delivery zone" },
        { status: 400 },
      );
    }

    const day = (await getWeekendOptions()).find((o) => o.date === fulfillment.date);
    if (!day?.delivery.available) {
      return NextResponse.json(
        {
          error:
            "Delivery isn't available on that day — please choose another Saturday or Sunday.",
        },
        { status: 400 },
      );
    }

    const feeCents = computeDeliveryFeeCents(zone, totalCents);
    lineItems.push({
      name: `Delivery: ${zone.neighborhood}, ${zone.borough} — ${formatWeekendDate(fulfillment.date)}`,
      quantity: 1,
      unitPriceCents: feeCents,
    });

    ctxFulfillment = {
      kind: "delivery",
      neighborhood: zone.neighborhood,
      borough: zone.borough,
      address: fulfillment.address,
      feeCents,
      date: fulfillment.date,
      hours: day.delivery.hours,
    };
  }

  // The cart is only cleared and confirmation emails are only sent once the
  // buyer actually completes payment on Square's page and lands back on
  // /checkout/success — not here, since the payment link existing doesn't
  // mean anyone has paid yet. The payment link is created first (without a
  // redirect_url — Square assigns the order's ID as part of this same
  // call), then the redirect URL — which needs that order ID baked into it
  // so /checkout/success can look the order up directly — is attached in a
  // second call. See createPaymentLink's doc comment in square.ts for why
  // it's split this way.
  let paymentLink;
  try {
    paymentLink = await createPaymentLink(lineItems, customerEmail.trim());
  } catch (err) {
    console.error("Square payment link creation failed", err);
    // Still as specific as we can safely be about WHY, falling back to a
    // generic message otherwise — the client always shows a WhatsApp
    // fallback alongside it regardless of which message lands.
    const message =
      err instanceof SquareApiError && err.isEmailError()
        ? "That email address doesn't look valid — please double-check it and try again."
        : "We couldn't start checkout right now. Please try again in a moment.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Square's own computed total (including tax — see createPaymentLink)
  // rather than the client's pre-tax totalCents. ctx.totalCents is what the
  // fallback order-matching in /checkout/success compares against real
  // Square order totals with, so it has to be the real, final, tax-inclusive
  // amount or that fallback would never match.
  const ctx = encodeCheckoutContext({
    name: customerName,
    email: customerEmail,
    phone: customerPhone,
    totalCents: paymentLink.totalCents,
    fulfillment: ctxFulfillment,
    orderId: paymentLink.orderId,
  });
  const origin = new URL(request.url).origin;
  const redirectUrl = `${origin}/checkout/success?ctx=${ctx}`;

  try {
    await setPaymentLinkRedirect(paymentLink.id, paymentLink.version, redirectUrl);
  } catch (err) {
    // The payment link itself was created successfully at this point — only
    // the redirect attach failed — but without it the buyer would land on
    // Square's generic "Thank you" page instead of ours, with no order
    // confirmation email triggered. Safer to fail the whole checkout here
    // (same WhatsApp-backed error experience as above) than hand back a
    // link that silently skips our confirmation flow.
    console.error("Square payment link redirect attach failed", err);
    return NextResponse.json(
      {
        error:
          "We couldn't start checkout right now. Please try again in a moment.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ url: paymentLink.url });
}
