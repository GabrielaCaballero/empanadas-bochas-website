import { redirect } from "next/navigation";
import { getRecentOrders, findRecentMatchingOrder, formatPrice } from "@/lib/square";
import { decodeCheckoutContext } from "@/lib/checkout-context";
import { sendEmail, BUSINESS_EMAIL } from "@/lib/email";
import { buildSquareOrderSummaryHtml } from "@/lib/order-summary";
import { buildOrderReceiptPdf } from "@/lib/order-pdf";
import { PICKUP_ADDRESS } from "@/lib/business-info";
import CheckoutSuccessClient from "@/components/CheckoutSuccessClient";

const MATCH_WINDOW_MS = 30 * 60 * 1000;

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ctx?: string }>;
}) {
  const { ctx: ctxParam } = await searchParams;
  const ctx = ctxParam ? decodeCheckoutContext(ctxParam) : null;
  if (!ctx) redirect("/cart?error=order");

  // There's no order ID to look up directly (Square only hands that back
  // after the payment link is created, before we know the redirect_url is
  // even needed) — so a completed payment is confirmed by finding a
  // recent paid order with a matching total. Anything else (canceled/
  // abandoned checkout, tampered link) means no such order exists and we
  // bail to the cart with an error.
  const orders = await getRecentOrders(MATCH_WINDOW_MS);
  const order = findRecentMatchingOrder(orders, ctx.totalCents, MATCH_WINDOW_MS);

  if (!order) redirect("/cart?error=order");

  const fulfillment = ctx.fulfillment;
  let pickupHtml: string;
  let emailSubject: string;
  if (fulfillment.kind === "event") {
    pickupHtml = `<p><strong>Pickup:</strong> ${fulfillment.venue}, ${fulfillment.eventDate} (${fulfillment.eventTime})<br/>${fulfillment.eventAddress}</p>`;
    emailSubject = `New pickup order — ${fulfillment.venue}, ${fulfillment.eventDate}`;
  } else if (fulfillment.kind === "kitchen") {
    pickupHtml = `<p><strong>Pickup:</strong> Our Kitchen, ${PICKUP_ADDRESS}</p>`;
    emailSubject = `New kitchen pickup order — ${ctx.name}`;
  } else {
    pickupHtml = `<p><strong>Delivery to:</strong> ${fulfillment.address}<br/>${fulfillment.neighborhood}, ${fulfillment.borough}<br/>Delivery fee: ${fulfillment.feeCents === 0 ? "Free" : formatPrice(fulfillment.feeCents)}</p>`;
    emailSubject = `New delivery order — ${fulfillment.neighborhood}, ${fulfillment.borough}`;
  }
  const orderSummaryHtml = buildSquareOrderSummaryHtml(order);

  try {
    await sendEmail({
      to: BUSINESS_EMAIL,
      subject: emailSubject,
      html: `${pickupHtml}<p>Name: ${ctx.name}<br/>Email: ${ctx.email}<br/>Phone: ${ctx.phone}</p>${orderSummaryHtml}`,
      idempotencyKey: `business-${order.id}`,
    });
  } catch (err) {
    console.error("Business notification email failed", err);
  }

  try {
    const receiptPdf = await buildOrderReceiptPdf({
      order,
      customerName: ctx.name,
      fulfillment,
    });
    await sendEmail({
      to: ctx.email,
      subject: "Your Empanadas Bochas order",
      html: `<p>Thanks for your order, ${ctx.name}! Your receipt is attached.</p>${pickupHtml}`,
      idempotencyKey: `customer-${order.id}`,
      attachments: [{ filename: "receipt.pdf", content: receiptPdf }],
    });
  } catch (err) {
    console.error("Customer confirmation email failed", err);
  }

  return (
    <CheckoutSuccessClient
      customerName={ctx.name}
      customerEmail={ctx.email}
      fulfillment={fulfillment}
      lineItems={order.lineItems}
      totalCents={order.totalCents}
    />
  );
}
