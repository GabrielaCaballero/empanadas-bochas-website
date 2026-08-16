import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatPrice, type OrderSummary } from "./square";
import type { CheckoutContext } from "./checkout-context";
import { PICKUP_ADDRESS } from "./business-info";

const PAGE_WIDTH = 396; // 5.5in at 72dpi — a compact receipt, not a full page
const MARGIN = 36;
const MAROON = rgb(0.29, 0.078, 0.078);
const GRAY = rgb(0.4, 0.4, 0.4);

export async function buildOrderReceiptPdf({
  order,
  customerName,
  fulfillment,
}: {
  order: OrderSummary;
  customerName: string;
  fulfillment: CheckoutContext["fulfillment"];
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Height is derived from content, so this grows if there's a long order.
  const lineCount = order.lineItems.length;
  const height = 260 + lineCount * 18;
  const page = doc.addPage([PAGE_WIDTH, height]);

  let y = height - MARGIN;
  const left = MARGIN;

  function draw(
    text: string,
    { size = 11, color = rgb(0, 0, 0), useBold = false, gap = 16 } = {},
  ) {
    page.drawText(text, {
      x: left,
      y,
      size,
      font: useBold ? bold : font,
      color,
    });
    y -= gap;
  }

  draw("Empanadas Bochas", { size: 18, useBold: true, color: MAROON, gap: 22 });
  draw(`Order receipt — ${customerName}`, { size: 11, color: GRAY, gap: 20 });

  if (fulfillment.kind === "event") {
    draw("Pickup", { size: 10, useBold: true, color: GRAY, gap: 14 });
    draw(fulfillment.venue, { size: 12, useBold: true, gap: 16 });
    draw(`${fulfillment.eventDate} · ${fulfillment.eventTime}`, {
      size: 11,
      color: GRAY,
      gap: 14,
    });
    draw(fulfillment.eventAddress, { size: 11, color: GRAY, gap: 22 });
  } else if (fulfillment.kind === "kitchen") {
    draw("Pickup", { size: 10, useBold: true, color: GRAY, gap: 14 });
    draw("Our Kitchen", { size: 12, useBold: true, gap: 16 });
    draw(PICKUP_ADDRESS, { size: 11, color: GRAY, gap: 22 });
  } else {
    draw("Delivery", { size: 10, useBold: true, color: GRAY, gap: 14 });
    draw(fulfillment.address, { size: 12, useBold: true, gap: 16 });
    draw(`${fulfillment.neighborhood}, ${fulfillment.borough}`, {
      size: 11,
      color: GRAY,
      gap: 14,
    });
    draw(
      `Delivery fee: ${fulfillment.feeCents === 0 ? "Free" : formatPrice(fulfillment.feeCents)}`,
      { size: 11, color: GRAY, gap: 22 },
    );
  }

  draw("Order summary", { size: 10, useBold: true, color: GRAY, gap: 18 });
  for (const item of order.lineItems) {
    const priceLabel =
      item.totalCents === 0 ? "Free" : (formatPrice(item.totalCents) ?? "$0.00");
    const priceWidth = font.widthOfTextAtSize(priceLabel, 11);
    page.drawText(`${item.quantity}x ${item.name}`, {
      x: left,
      y,
      size: 11,
      font,
      color: rgb(0, 0, 0),
    });
    page.drawText(priceLabel, {
      x: PAGE_WIDTH - MARGIN - priceWidth,
      y,
      size: 11,
      font,
      color: rgb(0, 0, 0),
    });
    y -= item.note ? 14 : 18;
    if (item.note) {
      draw(item.note, { size: 10, color: GRAY, gap: 18 });
    }
  }

  y -= 6;
  page.drawLine({
    start: { x: left, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= 20;

  draw(`Total: ${formatPrice(order.totalCents)}`, { size: 13, useBold: true, color: MAROON });

  return doc.save();
}
