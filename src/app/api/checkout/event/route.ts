import { NextResponse } from "next/server";
import { createPaymentLink, formatPrice } from "@/lib/square";
import { sendEmail, BUSINESS_EMAIL } from "@/lib/email";
import { buildSquareLineItems, buildOrderSummaryHtml } from "@/lib/order-summary";
import { events } from "@/lib/events";
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

  let paymentLink;
  try {
    paymentLink = await createPaymentLink(lineItems);
  } catch (err) {
    console.error("Square payment link creation failed", err);
    return NextResponse.json(
      { error: "Could not create payment link" },
      { status: 502 },
    );
  }

  const orderSummaryHtml = buildOrderSummaryHtml({
    items,
    sauces,
    freeSauceAllotment,
    saucePriceCents,
    totalCents,
  });
  const pickupHtml = `<p><strong>Pickup:</strong> ${event.venue}, ${event.date} (${event.time})<br/>${event.address}</p>`;
  const customerContactHtml = `<p>Name: ${customerName}<br/>Email: ${customerEmail}<br/>Phone: ${customerPhone}</p>`;

  try {
    await sendEmail({
      to: BUSINESS_EMAIL,
      subject: `New pickup order — ${event.venue}, ${event.date}`,
      html: `${pickupHtml}${customerContactHtml}${orderSummaryHtml}<p>Total: ${formatPrice(totalCents)}</p>`,
    });
  } catch (err) {
    console.error("Business notification email failed", err);
  }

  try {
    await sendEmail({
      to: customerEmail,
      subject: "Your Empanadas Bochas order",
      html: `<p>Thanks for your order, ${customerName}!</p>${pickupHtml}${orderSummaryHtml}`,
    });
  } catch (err) {
    console.error("Customer confirmation email failed", err);
  }

  return NextResponse.json({ url: paymentLink.url });
}
