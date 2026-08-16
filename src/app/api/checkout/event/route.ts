import { NextResponse } from "next/server";
import { createPaymentLink } from "@/lib/square";
import { buildSquareLineItems } from "@/lib/order-summary";
import { getUpcomingEvents } from "@/lib/events";
import { encodeCheckoutContext } from "@/lib/checkout-context";
import type { CartLineItem } from "@/lib/cart-context";

type RequestBody = {
  items: CartLineItem[];
  sauces: Record<string, number>;
  freeSauceAllotment: number;
  saucePriceCents: number;
  totalCents: number;
  eventDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
};

export async function POST(request: Request) {
  const body: RequestBody = await request.json();
  const {
    items,
    sauces,
    freeSauceAllotment,
    saucePriceCents,
    totalCents,
    eventDate,
    customerName,
    customerEmail,
    customerPhone,
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

  const events = await getUpcomingEvents();
  const event = events.find((e) => e.date === eventDate);
  if (!event) {
    return NextResponse.json({ error: "Unknown event" }, { status: 400 });
  }

  const lineItems = buildSquareLineItems(
    items,
    sauces,
    freeSauceAllotment,
    saucePriceCents,
  );
  lineItems.push({
    name: `Pickup: ${event.venue}, ${event.date}`,
    quantity: 1,
    unitPriceCents: 0,
  });

  // The cart is only cleared and confirmation emails are only sent once the
  // buyer actually completes payment on Square's page and lands back on
  // /checkout/success — not here, since a payment link being created doesn't
  // mean anyone has paid yet. Customer/event context rides along in the
  // redirect URL since there's no order ID to key off until after payment.
  const ctx = encodeCheckoutContext({
    name: customerName,
    email: customerEmail,
    phone: customerPhone,
    venue: event.venue,
    eventDate: event.date,
    eventTime: event.time,
    eventAddress: event.address,
    totalCents,
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
