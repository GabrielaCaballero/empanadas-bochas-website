import crypto from "crypto";

// Lets a customer's confirmation email link straight to their own order
// without needing accounts or a database: the token is just the Square
// order ID plus an HMAC signature, so it can be verified statelessly and
// can't be forged or guessed for someone else's order.
function getSecret(): string {
  const secret = process.env.ORDER_LINK_SECRET;
  if (!secret) {
    throw new Error("Missing ORDER_LINK_SECRET env var");
  }
  return secret;
}

export function signOrderToken(orderId: string): string {
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(orderId)
    .digest("base64url");
  return Buffer.from(`${orderId}.${signature}`).toString("base64url");
}

export function verifyOrderToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const dotIndex = decoded.indexOf(".");
    if (dotIndex === -1) return null;

    const orderId = decoded.slice(0, dotIndex);
    const signature = decoded.slice(dotIndex + 1);

    const expected = crypto
      .createHmac("sha256", getSecret())
      .update(orderId)
      .digest("base64url");

    const signatureBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expected);
    if (signatureBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(signatureBuf, expectedBuf)) return null;

    return orderId;
  } catch {
    return null;
  }
}
