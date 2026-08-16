import { redirect } from "next/navigation";
import { getRecentOrders, findRecentMatchingOrder, formatPrice } from "@/lib/square";
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
      lines: [PICKUP_ADDRESS],
    });
    emailSubject = `New kitchen pickup order — ${ctx.name}`;
  } else {
    pickupCardHtml = buildInfoCardHtml({
      label: "Delivery",
      title: fulfillment.address,
      lines: [
        `${fulfillment.neighborhood}, ${fulfillment.borough}`,
        `Delivery fee: ${fulfillment.feeCents === 0 ? "Free" : formatPrice(fulfillment.feeCents)}`,
      ],
    });
    emailSubject = `New delivery order — ${fulfillment.neighborhood}, ${fulfillment.borough}`;
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
    />
  );
}
