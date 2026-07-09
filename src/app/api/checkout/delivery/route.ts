import { NextResponse } from "next/server";
import { formatPrice } from "@/lib/square";
import { sendEmail, BUSINESS_EMAIL } from "@/lib/email";
import { buildOrderSummaryHtml } from "@/lib/order-summary";
import type { CartLineItem } from "@/lib/cart-context";

type RequestBody = {
  items: CartLineItem[];
  sauces: Record<string, number>;
  freeSauceAllotment: number;
  saucePriceCents: number;
  totalCents: number;
  address: string;
  preferredDate: string;
  notes: string;
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
    address,
    preferredDate,
    notes,
    customerName,
    customerEmail,
    customerPhone,
  } = body;

  if (!items?.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }
  if (!customerName || !customerEmail || !customerPhone || !address) {
    return NextResponse.json(
      { error: "Missing customer contact info or address" },
      { status: 400 },
    );
  }

  const orderSummaryHtml = buildOrderSummaryHtml({
    items,
    sauces,
    freeSauceAllotment,
    saucePriceCents,
    totalCents,
  });
  const deliveryHtml = `
    <p>
      <strong>Delivery address:</strong> ${address}<br/>
      <strong>Preferred date:</strong> ${preferredDate || "Not specified"}<br/>
      ${notes ? `<strong>Notes:</strong> ${notes}<br/>` : ""}
    </p>
  `;
  const customerContactHtml = `<p>Name: ${customerName}<br/>Email: ${customerEmail}<br/>Phone: ${customerPhone}</p>`;

  try {
    await sendEmail({
      to: BUSINESS_EMAIL,
      subject: "New delivery request",
      html: `${deliveryHtml}${customerContactHtml}${orderSummaryHtml}<p>Subtotal (before delivery fee): ${formatPrice(totalCents)}</p><p>Reply to the customer with the delivery fee and a Square payment link.</p>`,
    });
  } catch (err) {
    console.error("Business notification email failed", err);
    return NextResponse.json(
      { error: "Could not send order notification" },
      { status: 502 },
    );
  }

  try {
    await sendEmail({
      to: customerEmail,
      subject: "We got your delivery request — Empanadas Bochas",
      html: `<p>Thanks for your order, ${customerName}! We'll text or email you shortly with the delivery fee and a payment link.</p>${deliveryHtml}${orderSummaryHtml}`,
    });
  } catch (err) {
    console.error("Customer confirmation email failed", err);
  }

  return NextResponse.json({ success: true });
}
