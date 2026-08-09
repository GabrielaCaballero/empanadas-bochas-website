import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getOrdersByEmail, findRecentMatchingOrder } from "@/lib/square";
import { decodeCheckoutContext } from "@/lib/checkout-context";
import { sendEmail, BUSINESS_EMAIL } from "@/lib/email";
import { buildSquareOrderSummaryHtml } from "@/lib/order-summary";
import { signOrderToken } from "@/lib/order-token";
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
  // matching paid order for this email, created around when this checkout
  // was started. Anything else (canceled/abandoned checkout, tampered
  // link) means no such order exists and we bail to the cart with an error.
  const orders = await getOrdersByEmail(ctx.email);
  const order = findRecentMatchingOrder(orders, ctx.totalCents, MATCH_WINDOW_MS);

  if (!order) redirect("/cart?error=order");

  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  const orderLink = `${protocol}://${host}/orders/${signOrderToken(order.id)}`;

  const pickupHtml = `<p><strong>Pickup:</strong> ${ctx.venue}, ${ctx.eventDate} (${ctx.eventTime})<br/>${ctx.eventAddress}</p>`;
  const orderSummaryHtml = buildSquareOrderSummaryHtml(order);
  const orderLinkHtml = `<p>View this order anytime: <a href="${orderLink}">${orderLink}</a></p>`;

  try {
    await sendEmail({
      to: BUSINESS_EMAIL,
      subject: `New pickup order — ${ctx.venue}, ${ctx.eventDate}`,
      html: `${pickupHtml}<p>Name: ${ctx.name}<br/>Email: ${ctx.email}<br/>Phone: ${ctx.phone}</p>${orderSummaryHtml}`,
      idempotencyKey: `business-${order.id}`,
    });
  } catch (err) {
    console.error("Business notification email failed", err);
  }

  try {
    await sendEmail({
      to: ctx.email,
      subject: "Your Empanadas Bochas order",
      html: `<p>Thanks for your order, ${ctx.name}!</p>${pickupHtml}${orderSummaryHtml}${orderLinkHtml}`,
      idempotencyKey: `customer-${order.id}`,
    });
  } catch (err) {
    console.error("Customer confirmation email failed", err);
  }

  return (
    <CheckoutSuccessClient
      customerName={ctx.name}
      customerEmail={ctx.email}
      venue={ctx.venue}
      eventDate={ctx.eventDate}
      eventTime={ctx.eventTime}
      eventAddress={ctx.eventAddress}
      lineItems={order.lineItems}
      totalCents={order.totalCents}
      orderLink={orderLink}
    />
  );
}
