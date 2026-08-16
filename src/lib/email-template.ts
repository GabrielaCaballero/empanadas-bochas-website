import { formatPrice, type OrderSummary } from "./square";

// Absolute URLs since email clients fetch images over HTTP, not from the
// local filesystem — these must point at the deployed site.
const SITE_URL = "https://empanadasbochas.com";
const LOGO_URL = `${SITE_URL}/brand/logo.png`;
const FOOD_PHOTO_URL = `${SITE_URL}/photos/empanada-5.png`;

const MAROON = "#3C1214";
const TERRACOTTA = "#C75F3A";
const CREAM = "#EECBA5";
const ROW_TINT = "#FBF3E8";
const MUTED = "#8a7a6d";

// A pickup/delivery detail card, styled consistently across both the
// business and customer emails.
export function buildInfoCardHtml({
  label,
  title,
  lines,
}: {
  label: string;
  title: string;
  lines: string[];
}): string {
  const linesHtml = lines
    .map(
      (line) =>
        `<div style="margin-top:2px;font-size:14px;color:#5c4a3d;">${line}</div>`,
    )
    .join("");
  return `
    <div style="background-color:${ROW_TINT};border-radius:12px;padding:16px 18px;margin-bottom:20px;">
      <div style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.05em;color:${MUTED};">${label}</div>
      <div style="margin-top:4px;font-size:16px;font-weight:bold;color:${MAROON};">${title}</div>
      ${linesHtml}
    </div>
  `;
}

// Replaces the old flat <ul> order summary with a table: item + note on the
// left, price on the right, alternating row tint, total row set off with a
// terracotta rule.
export function buildOrderItemsTableHtml(order: OrderSummary): string {
  const rows = order.lineItems
    .map((item, i) => {
      const bg = i % 2 === 0 ? "#ffffff" : ROW_TINT;
      const priceLabel =
        item.totalCents === 0 ? "Free" : formatPrice(item.totalCents);
      const noteHtml = item.note
        ? `<div style="font-size:12px;color:${MUTED};margin-top:2px;">${item.note}</div>`
        : "";
      return `
        <tr style="background-color:${bg};">
          <td style="padding:10px 14px;font-size:14px;color:${MAROON};">
            <strong>${item.quantity}x</strong> ${item.name}
            ${noteHtml}
          </td>
          <td style="padding:10px 14px;font-size:14px;color:${MAROON};text-align:right;white-space:nowrap;">
            ${priceLabel}
          </td>
        </tr>`;
    })
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:12px;overflow:hidden;border:1px solid #eee0cf;">
      ${rows}
      <tr>
        <td style="padding:12px 14px;font-size:15px;font-weight:bold;color:${MAROON};border-top:2px solid ${TERRACOTTA};">
          Total
        </td>
        <td style="padding:12px 14px;font-size:15px;font-weight:bold;color:${MAROON};text-align:right;border-top:2px solid ${TERRACOTTA};">
          ${formatPrice(order.totalCents)}
        </td>
      </tr>
    </table>
  `;
}

// Shared branded shell for every transactional email — logo header, white
// content card, cream footer with contact links. showFoodPhoto adds a
// banner photo below the logo, used for the customer-facing confirmation
// (kept off the business notification to stay compact/functional).
export function buildEmailShellHtml({
  heading,
  bodyHtml,
  showFoodPhoto = false,
}: {
  heading: string;
  bodyHtml: string;
  showFoodPhoto?: boolean;
}): string {
  return `
    <div style="background-color:${CREAM};padding:32px 16px;font-family:Helvetica,Arial,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background-color:#ffffff;border-radius:20px;overflow:hidden;">
        <tr>
          <td style="background-color:${MAROON};padding:28px 24px;text-align:center;">
            <img src="${LOGO_URL}" alt="Empanadas Bochas" width="170" style="display:block;margin:0 auto;border:0;" />
          </td>
        </tr>
        ${
          showFoodPhoto
            ? `<tr>
                <td>
                  <img src="${FOOD_PHOTO_URL}" alt="" width="520" style="display:block;width:100%;height:auto;border:0;" />
                </td>
              </tr>`
            : ""
        }
        <tr>
          <td style="padding:28px 24px;">
            <h1 style="margin:0 0 16px;font-size:22px;color:${MAROON};font-family:Georgia,serif;">${heading}</h1>
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="background-color:${CREAM};padding:18px 24px;text-align:center;font-size:12px;color:${MAROON};">
            Empanadas Bochas &middot; Homemade Argentine empanadas &middot; NYC<br/>
            <a href="https://wa.me/19178303570" style="color:${TERRACOTTA};text-decoration:none;">WhatsApp</a>
            &nbsp;&middot;&nbsp;
            <a href="mailto:empanadasbochas@gmail.com" style="color:${TERRACOTTA};text-decoration:none;">Email</a>
            &nbsp;&middot;&nbsp;
            <a href="https://www.instagram.com/empanadasbochas/" style="color:${TERRACOTTA};text-decoration:none;">Instagram</a>
          </td>
        </tr>
      </table>
    </div>
  `;
}
