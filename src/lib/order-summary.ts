import type { CartLineItem } from "./cart-context";
import { formatPrice, type CheckoutLineItem } from "./square";

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

export function buildOrderSummaryHtml({
  items,
  sauces,
  freeSauceAllotment,
  saucePriceCents,
  totalCents,
}: {
  items: CartLineItem[];
  sauces: Record<string, number>;
  freeSauceAllotment: number;
  saucePriceCents: number;
  totalCents: number;
}): string {
  const itemRows = items
    .map((item) => {
      const flavorNote = item.flavors
        ? `<br/><span style="color:#666;font-size:13px">${Object.entries(
            item.flavors,
          )
            .filter(([, count]) => count > 0)
            .map(([flavor, count]) => `${count}x ${flavor}`)
            .join(", ")}</span>`
        : "";
      return `<li>${item.quantity}x ${item.name} — ${formatPrice(item.unitPriceCents * item.quantity)}${flavorNote}</li>`;
    })
    .join("");

  const sauceRows = sauceBreakdown(sauces, freeSauceAllotment)
    .map(({ flavor, free, paid }) => {
      const parts: string[] = [];
      if (free > 0) parts.push(`${free}x ${flavor} (free)`);
      if (paid > 0)
        parts.push(`${paid}x ${flavor} (${formatPrice(saucePriceCents)} ea)`);
      return `<li>${parts.join(", ")}</li>`;
    })
    .join("");

  return `
    <h2>Order Summary</h2>
    <ul>${itemRows}</ul>
    ${sauceRows ? `<h3>Sauces</h3><ul>${sauceRows}</ul>` : ""}
    <p><strong>Total: ${formatPrice(totalCents)}</strong></p>
  `;
}
