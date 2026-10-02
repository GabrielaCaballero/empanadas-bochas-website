import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  getOrderById,
  getRecentOrders,
  findRecentMatchingOrder,
  formatPrice,
  type OrderSummary,
} from "@/lib/square";
import { decodeCheckoutContext } from "@/lib/checkout-context";
import { sendEmail, BUSINESS_EMAIL } from "@/lib/email";
import {
  buildEmailShellHtml,
  buildInfoCardHtml,
  buildOrderItemsTableHtml,
} from "@/lib/email-template";
import { buildOrderReceiptPdf } from "@/lib/order-pdf";
import { PICKUP_ADDRESS } from "@/lib/business-info";
import CheckoutSuccessClient from "@/components/CheckoutSuccessClient";
import { formatWeekendDate } from "@/lib/weekend-dates";

const MATCH_WINDOW_MS = 30 * 60 * 1000;

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false, follow: true },
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ctx?: string }>;
}) {
  const { ctx: ctxParam } = await searchParams;
  const ctx = ctxParam ? decodeCheckoutContext(ctxParam) : null;
  if (!ctx) redirect("/cart?error=order");

  // Looked up directly by ID (known since before the buyer ever paid — see
  // createPaymentLink's doc comment in square.ts) rather than guessed from
  // recent orders by total+recency, which could occasionally match a
  // DIFFERENT customer's order with the same total (see
  // findRecentMatchingOrder's doc comment). The total+recency search is
  // kept only as a fallback: a ctx blob encoded before this existed, or a
  // transient failure on the direct lookup itself.
  let order: OrderSummary | null = null;
  if (ctx.orderId) {
    try {
      order = await getOrderById(ctx.orderId);
    } catch (err) {
      console.error("Direct order lookup failed, falling back to search", err);
    }
  }
  if (!order) {
    const orders = await getRecentOrders(MATCH_WINDOW_MS);
    order = findRecentMatchingOrder(orders, ctx.totalCents, MATCH_WINDOW_MS) ?? null;
  }

  // Not found (canceled/abandoned checkout, tampered link) or found but
  // still unpaid (getOrderById already filters to paid states, but a
  // not-yet-indexed order via the search fallback wouldn't have reached
  // this far anyway) means there's nothing to confirm — bail to the cart.
  if (!order) redirect("/cart?error=order");

  const fulfillment = ctx.fulfillment;
  let pickupCardHtml: string;
  let emailSubject: string;
  if (fulfillment.kind === "event") {
    pickupCardHtml = buildInfoCardHtml({
      label: "Pickup",
      title: fulfillment.venue,
      lines: [
        `${fulfillment.eventDate} &middot; ${fulfillment.eventTime}`,
        fulfillment.eventAddress,
      ],
    });
    emailSubject = `New pickup order — ${fulfillment.venue}, ${fulfillment.eventDate}`;
  } else if (fulfillment.kind === "kitchen") {
    pickupCardHtml = buildInfoCardHtml({
      label: "Pickup",
      title: "Our Kitchen",
      lines: [
        ...(fulfillment.date ? [formatWeekendDate(fulfillment.date, true)] : []),
        PICKUP_ADDRESS,
      ],
    });
    emailSubject = `New kitchen pickup order${fulfillment.date ? ` — ${formatWeekendDate(fulfillment.date)}` : ""} — ${ctx.name}`;
  } else {
    pickupCardHtml = buildInfoCardHtml({
      label: "Delivery",
      title: fulfillment.address,
      lines: [
        ...(fulfillment.date ? [formatWeekendDate(fulfillment.date, true)] : []),
        `${fulfillment.neighborhood}, ${fulfillment.borough}`,
        `Delivery fee: ${fulfillment.feeCents === 0 ? "Free" : formatPrice(fulfillment.feeCents)}`,
      ],
    });
    emailSubject = `New delivery order${fulfillment.date ? ` — ${formatWeekendDate(fulfillment.date)}` : ""} — ${fulfillment.neighborhood}, ${fulfillment.borough}`;
  }
  const orderItemsTableHtml = buildOrderItemsTableHtml(order);

  try {
    const businessBodyHtml = `
      ${pickupCardHtml}
      <div style="margin-bottom:20px;font-size:14px;color:#3C1214;line-height:1.6;">
        <strong>Name:</strong> ${ctx.name}<br/>
        <strong>Email:</strong> ${ctx.email}<br/>
        <strong>Phone:</strong> ${ctx.phone}
      </div>
      ${orderItemsTableHtml}
    `;
    await sendEmail({
      to: BUSINESS_EMAIL,
      subject: emailSubject,
      html: buildEmailShellHtml({ heading: "New order", bodyHtml: businessBodyHtml }),
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
    const customerBodyHtml = `
      <p style="margin:0 0 20px;font-size:15px;color:#5c4a3d;line-height:1.6;">
        Thanks for your order, ${ctx.name}! A detailed receipt is attached as a PDF.
      </p>
      ${pickupCardHtml}
      ${orderItemsTableHtml}
    `;
    await sendEmail({
      to: ctx.email,
      subject: "Your Empanadas Bochas order",
      html: buildEmailShellHtml({
        heading: "Order confirmed! 🎉",
        bodyHtml: customerBodyHtml,
        showFoodPhoto: true,
      }),
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
      totalTaxCents={order.totalTaxCents}
    />
  );
}
