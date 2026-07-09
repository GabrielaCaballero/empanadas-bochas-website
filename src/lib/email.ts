const RESEND_BASE_URL = "https://api.resend.com";

// Resend requires a verified sending domain to email arbitrary recipients.
// Until empanadasbochas.com is verified, this "from" address only allows
// sending to the Resend account owner's own email — fine for testing, not
// yet for real customer emails. No code changes needed once verified.
const FROM_ADDRESS = "Empanadas Bochas <onboarding@resend.dev>";
const BUSINESS_EMAIL = "empanadasbochas@gmail.com";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
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
