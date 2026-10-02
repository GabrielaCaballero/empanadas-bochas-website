// Square redirects the buyer back to our site after payment with only an
// order ID — there's no database to look up the rest of the order context
// (customer contact info, which fulfillment they picked) by, so it's
// round-tripped through the redirect URL itself as a base64url-encoded blob.
export type CheckoutContext = {
  name: string;
  email: string;
  phone: string;
  totalCents: number; // final charged total, including delivery fee if any
  // The Square order created alongside the payment link, known before the
  // buyer ever pays — lets /checkout/success look the order up directly by
  // ID instead of guessing from recent orders by total+recency. Optional
  // only so a ctx blob encoded by an older deploy (already in flight in
  // someone's browser during a release) still decodes without crashing;
  // every new checkout always sets it.
  orderId?: string;
  fulfillment:
    | {
        kind: "event";
        venue: string;
        eventDate: string;
        eventTime: string;
        eventAddress: string;
      }
    // date: the weekend day (YYYY-MM-DD) chosen for kitchen pickup/delivery —
    // those are weekend-only (see weekend-dates.ts). Optional only so a ctx
    // encoded before this existed still decodes.
    | { kind: "kitchen"; date?: string }
    | {
        kind: "delivery";
        neighborhood: string;
        borough: string;
        address: string;
        feeCents: number;
        date?: string;
      };
};

export function encodeCheckoutContext(ctx: CheckoutContext): string {
  return Buffer.from(JSON.stringify(ctx)).toString("base64url");
}

export function decodeCheckoutContext(encoded: string): CheckoutContext | null {
  try {
    const json = Buffer.from(encoded, "base64url").toString("utf-8");
    const parsed = JSON.parse(json);
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as CheckoutContext;
  } catch {
    return null;
  }
}
