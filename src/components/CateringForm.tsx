"use client";

import { useState, type FormEvent } from "react";
import { whatsAppUrl } from "@/lib/business-info";

const EVENT_TYPES = [
  "Corporate / office event",
  "Birthday",
  "Private event",
  "Recurring order",
  "Something else",
];

const inputClass =
  "mt-1 w-full rounded-xl border border-maroon/20 bg-background px-4 py-3 text-maroon";

export default function CateringForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/catering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong");
      form.reset();
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-3xl bg-cream p-8">
        <p className="font-display text-2xl font-semibold text-maroon">
          Thank you!
        </p>
        <p className="mt-2 text-maroon/70">
          We got your message and will reply by email soon. If it&rsquo;s
          time-sensitive, message us on WhatsApp too.
        </p>
        <a
          href={whatsAppUrl("Hi! I just sent a catering inquiry through the website.")}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block rounded-full bg-terracotta px-6 py-3 font-semibold text-background transition-colors hover:bg-rust"
        >
          Message us on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate={false}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-maroon/70" htmlFor="c-name">
            Name *
          </label>
          <input id="c-name" name="name" type="text" required maxLength={100} className={inputClass} />
        </div>
        <div>
          <label className="text-sm font-medium text-maroon/70" htmlFor="c-email">
            Email *
          </label>
          <input
            id="c-email"
            name="email"
            type="email"
            required
            pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
            title="Include a domain, like name@example.com"
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-maroon/70" htmlFor="c-phone">
            Phone
          </label>
          <input id="c-phone" name="phone" type="tel" maxLength={40} className={inputClass} />
        </div>
        <div>
          <label className="text-sm font-medium text-maroon/70" htmlFor="c-type">
            What kind of event?
          </label>
          <select id="c-type" name="eventType" defaultValue="" className={inputClass}>
            <option value="">Select…</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-maroon/70" htmlFor="c-date">
            Event date
          </label>
          <input id="c-date" name="eventDate" type="date" className={inputClass} />
        </div>
        <div>
          <label className="text-sm font-medium text-maroon/70" htmlFor="c-guests">
            Number of guests
          </label>
          <input id="c-guests" name="guests" type="number" min={1} max={10000} inputMode="numeric" className={inputClass} />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-maroon/70" htmlFor="c-message">
          Tell us about your event *
        </label>
        <textarea id="c-message" name="message" required rows={5} maxLength={3000} className={inputClass} />
      </div>

      {/* Honeypot — invisible to people, bots fill it in. */}
      <div className="absolute left-[-9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>
          Leave this empty
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">{error}</p>
          <a
            href={whatsAppUrl("Hi! I tried to send a catering inquiry on the website but ran into an error.")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            Message us on WhatsApp instead
          </a>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-full bg-terracotta px-6 py-3 font-semibold text-background transition-colors hover:bg-rust disabled:opacity-50"
        >
          {status === "sending" ? "Sending…" : "Send inquiry"}
        </button>
        <a
          href={whatsAppUrl("Hi! I'd like to ask about catering for an event.")}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-maroon/30 px-6 py-3 font-semibold text-maroon transition-colors hover:bg-maroon/5"
        >
          Or message us on WhatsApp
        </a>
      </div>
    </form>
  );
}
