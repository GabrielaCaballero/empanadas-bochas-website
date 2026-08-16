import { NextResponse } from "next/server";
import { createPaymentLink } from "@/lib/square";
import { buildSquareLineItems } from "@/lib/order-summary";
import { getUpcomingEvents } from "@/lib/events";
import { getDeliveryZones, computeDeliveryFeeCents } from "@/lib/delivery-pricing";
import { encodeCheckoutContext, type CheckoutContext } from "@/lib/checkout-context";
import { PICKUP_ADDRESS } from "@/lib/business-info";
import type { CartLineItem } from "@/lib/cart-context";

type Fulfillment =
  | { kind: "event"; eventDate: string; venue: string }
  | { kind: "kitchen" }
  | { kind: "delivery"; zoneId: string; address: string };

type RequestBody = {
  items: CartLineItem[];
  sauces: Record<string, number>;
  freeSauceAllotment: number;
  saucePriceCents: number;
  totalCents: number; // grand total BEFORE any delivery fee
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  fulfillment: Fulfillment;
};

export async function POST(request: Request) {
  const body: RequestBody = await request.json();
  const {
    items,
    sauces,
    freeSauceAllotment,
    saucePriceCents,
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

  const lineItems = buildSquareLineItems(
    items,
    sauces,
    freeSauceAllotment,
    saucePriceCents,
  );

  let ctxFulfillment: CheckoutContext["fulfillment"];
  let finalTotalCents = totalCents;

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
    lineItems.push({
      name: `Pickup: Our Kitchen, ${PICKUP_ADDRESS}`,
      quantity: 1,
      unitPriceCents: 0,
    });

    ctxFulfillment = { kind: "kitchen" };
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

    const feeCents = computeDeliveryFeeCents(zone, totalCents);
    lineItems.push({
      name: `Delivery: ${zone.neighborhood}, ${zone.borough}`,
      quantity: 1,
      unitPriceCents: feeCents,
    });
    finalTotalCents = totalCents + feeCents;

    ctxFulfillment = {
      kind: "delivery",
      neighborhood: zone.neighborhood,
      borough: zone.borough,
      address: fulfillment.address,
      feeCents,
    };
  }

  // The cart is only cleared and confirmation emails are only sent once the
  // buyer actually completes payment on Square's page and lands back on
  // /checkout/success — not here, since a payment link being created doesn't
  // mean anyone has paid yet. Customer/fulfillment context rides along in the
  // redirect URL since there's no order ID to key off until after payment.
  const ctx = encodeCheckoutContext({
    name: customerName,
    email: customerEmail,
    phone: customerPhone,
    totalCents: finalTotalCents,
    fulfillment: ctxFulfillment,
  });
  const origin = new URL(request.url).origin;
  const redirectUrl = `${origin}/checkout/success?ctx=${ctx}`;

  let paymentLink;
  try {
    paymentLink = await createPaymentLink(lineItems, redirectUrl, customerEmail);
  } catch (err) {
    console.error("Square payment link creation failed", err);
    return NextResponse.json(
      { error: "Could not create payment link" },
      { status: 502 },
    );
  }

  return NextResponse.json({ url: paymentLink.url });
}
