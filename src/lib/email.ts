const RESEND_BASE_URL = "https://api.resend.com";

// empanadasbochas.com is verified with Resend (SPF + DKIM), so this can send
// to any recipient rather than only the Resend account owner's own email.
const FROM_ADDRESS = "Empanadas Bochas <orders@empanadasbochas.com>";
const BUSINESS_EMAIL = "empanadasbochas@gmail.com";

export async function sendEmail({
  to,
  subject,
  html,
  idempotencyKey,
}: {
  to: string;
  subject: string;
  html: string;
  // Lets a caller safely re-trigger the same send (e.g. a customer refreshing
  // an order-confirmation page) without Resend actually emailing twice.
  idempotencyKey?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY env var");
  }

  const res = await fetch(`${RESEND_BASE_URL}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend request failed: ${res.status} ${body}`);
  }

  return res.json();
}

export { BUSINESS_EMAIL };
