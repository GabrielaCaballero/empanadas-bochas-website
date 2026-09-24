import type { CartLineItem } from "./cart-context";
import type { CheckoutLineItem } from "./square";

export function buildSquareLineItems(items: CartLineItem[]): CheckoutLineItem[] {
  const lineItems: CheckoutLineItem[] = [];

  for (const item of items) {
    lineItems.push({
      name: item.name,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      note: item.flavors
        ? Object.entries(item.flavors)
            .filter(([, count]) => count > 0)
            .map(([flavor, count]) => `${count}x ${flavor}`)
            .join(", ")
        : undefined,
    });

    // Free sauces are picked per-box (see itemSauceAllotment in
    // cart-context.tsx), so they ride along as their own $0 line right after
    // the box they came with, instead of one pooled sauce total for the
    // whole order. Any additional sauce a customer buys on top of their free
    // ones is added straight from the cart as its own normal, priced item
    // (see CartClient's "Add extra sauces"), so it already flows through the
    // loop above like any other product — no separate handling needed here.
    if (item.sauces) {
      for (const [flavor, count] of Object.entries(item.sauces)) {
        if (count <= 0) continue;
        lineItems.push({
          name: `Sauce - ${flavor} (free, with ${item.name})`,
          quantity: count,
          unitPriceCents: 0,
        });
      }
    }
  }

  return lineItems;
}
