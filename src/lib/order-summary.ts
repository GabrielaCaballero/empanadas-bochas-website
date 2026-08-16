import type { CartLineItem } from "./cart-context";
import { formatPrice, type CheckoutLineItem, type OrderSummary } from "./square";

function sauceBreakdown(
  sauces: Record<string, number>,
  freeSauceAllotment: number,
) {
  const totalSauces = Object.values(sauces).reduce((a, b) => a + b, 0);
  const paidSauces = Math.max(0, totalSauces - freeSauceAllotment);
  let remainingFree = totalSauces - paidSauces;

  const breakdown: { flavor: string; free: number; paid: number }[] = [];
  for (const [flavor, count] of Object.entries(sauces)) {
    if (count <= 0) continue;
    const free = Math.min(remainingFree, count);
    remainingFree -= free;
    breakdown.push({ flavor, free, paid: count - free });
  }
  return breakdown;
}

export function buildSquareLineItems(
  items: CartLineItem[],
  sauces: Record<string, number>,
  freeSauceAllotment: number,
  saucePriceCents: number,
): CheckoutLineItem[] {
  const lineItems: CheckoutLineItem[] = items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    unitPriceCents: item.unitPriceCents,
    note: item.flavors
      ? Object.entries(item.flavors)
          .filter(([, count]) => count > 0)
          .map(([flavor, count]) => `${count}x ${flavor}`)
          .join(", ")
      : undefined,
  }));

  for (const { flavor, free, paid } of sauceBreakdown(
    sauces,
    freeSauceAllotment,
  )) {
    if (free > 0) {
      lineItems.push({
        name: `Sauce - ${flavor} (free)`,
        quantity: free,
        unitPriceCents: 0,
      });
    }
    if (paid > 0) {
      lineItems.push({
        name: `Sauce - ${flavor}`,
        quantity: paid,
        unitPriceCents: saucePriceCents,
      });
    }
  }

  return lineItems;
}

// Builds an order summary sourced from a paid Square order (post-checkout)
// rather than the client's cart state — used once payment is confirmed, so
// it reflects what was actually charged.
export function buildSquareOrderSummaryHtml(order: OrderSummary): string {
  const itemRows = order.lineItems
    .map((item) => {
      const note = item.note
        ? `<br/><span style="color:#666;font-size:13px">${item.note}</span>`
        : "";
      return `<li>${item.quantity}x ${item.name}${note}</li>`;
    })
    .join("");

  return `
    <h2>Order Summary</h2>
    <ul>${itemRows}</ul>
    <p><strong>Total: ${formatPrice(order.totalCents)}</strong></p>
  `;
}
