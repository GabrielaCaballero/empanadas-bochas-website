import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatPrice, type OrderSummary } from "./square";

const PAGE_WIDTH = 396; // 5.5in at 72dpi — a compact receipt, not a full page
const MARGIN = 36;
const MAROON = rgb(0.29, 0.078, 0.078);
const GRAY = rgb(0.4, 0.4, 0.4);

export async function buildOrderReceiptPdf({
  order,
  customerName,
  venue,
  eventDate,
  eventTime,
  eventAddress,
}: {
  order: OrderSummary;
  customerName: string;
  venue: string;
  eventDate: string;
  eventTime: string;
  eventAddress: string;
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

  draw("Pickup", { size: 10, useBold: true, color: GRAY, gap: 14 });
  draw(venue, { size: 12, useBold: true, gap: 16 });
  draw(`${eventDate} · ${eventTime}`, { size: 11, color: GRAY, gap: 14 });
  draw(eventAddress, { size: 11, color: GRAY, gap: 22 });

  draw("Order summary", { size: 10, useBold: true, color: GRAY, gap: 18 });
  for (const item of order.lineItems) {
    draw(`${item.quantity}x ${item.name}`, { size: 11, gap: item.note ? 14 : 18 });
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
