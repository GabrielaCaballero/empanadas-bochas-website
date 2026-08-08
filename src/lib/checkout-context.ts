// Square redirects the buyer back to our site after payment with only an
// order ID — there's no database to look up the rest of the order context
// (customer contact info, which event they picked) by, so it's round-tripped
// through the redirect URL itself as a base64url-encoded blob instead.
export type CheckoutContext = {
  name: string;
  email: string;
  phone: string;
  venue: string;
  eventDate: string;
  eventTime: string;
  eventAddress: string;
  totalCents: number;
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
