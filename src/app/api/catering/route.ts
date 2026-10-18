import { NextResponse } from "next/server";
import { sendEmail, BUSINESS_EMAIL } from "@/lib/email";
import { buildEmailShellHtml } from "@/lib/email-template";
import { escapeHtml } from "@/lib/html";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Body = {
  name?: string;
  email?: string;
  phone?: string;
  eventType?: string;
  eventDate?: string;
  guests?: string;
  message?: string;
  // Honeypot: hidden from real visitors, so anything in it is a bot.
  website?: string;
};

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export async function POST(request: Request) {
  const { allowed } = checkRateLimit(`catering:${getClientIp(request)}`);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many messages — please wait a minute and try again." },
      { status: 429 },
    );
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Pretend success to bots so they don't retry or adapt.
  if (body.website) return NextResponse.json({ ok: true });

  const name = clean(body.name, 100);
  const email = clean(body.email, 200);
  const phone = clean(body.phone, 40);
  const eventType = clean(body.eventType, 60);
  const eventDate = clean(body.eventDate, 20);
  const guests = clean(body.guests, 10);
  const message = clean(body.message, 3000);

  if (!name || !message) {
    return NextResponse.json(
      { error: "Please add your name and a short message." },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "That email address looks incomplete — please include a domain, like name@example.com." },
      { status: 400 },
    );
  }

  const row = (label: string, value: string) =>
    value
      ? `<strong>${label}:</strong> ${escapeHtml(value)}<br/>`
      : "";

  const bodyHtml = `
    <div style="margin-bottom:20px;font-size:14px;color:#3C1214;line-height:1.7;">
      ${row("Name", name)}
      ${row("Email", email)}
      ${row("Phone", phone)}
      ${row("Event type", eventType)}
      ${row("Event date", eventDate)}
      ${row("Guests", guests)}
    </div>
    <div style="font-size:14px;color:#3C1214;line-height:1.6;white-space:pre-wrap;">${escapeHtml(message)}</div>
    <p style="margin:20px 0 0;font-size:12px;color:#8a7a6d;">Reply to this email to answer ${escapeHtml(name)} directly.</p>
  `;

  try {
    await sendEmail({
      to: BUSINESS_EMAIL,
      subject: `Catering inquiry${eventType ? ` — ${eventType.replace(/[\r\n]+/g, " ")}` : ""} — ${name.replace(/[\r\n]+/g, " ")}`,
      html: buildEmailShellHtml({ heading: "New catering inquiry", bodyHtml }),
      replyTo: email,
    });
  } catch (err) {
    console.error("Catering inquiry email failed", err);
    return NextResponse.json(
      { error: "We couldn't send your message right now." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
