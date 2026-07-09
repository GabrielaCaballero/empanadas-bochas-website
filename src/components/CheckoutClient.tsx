"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { events } from "@/lib/events";
import { formatPrice } from "@/lib/square";

const BUSINESS_WHATSAPP = "19178303570";
const PICKUP_ADDRESS = "45-21 45th Street, Long Island City, NY 11104";

type Mode = "event" | "house" | "delivery";

export default function CheckoutClient({
  saucePriceCents,
}: {
  saucePriceCents: number;
}) {
  const { items, sauces, totalCents, freeSauceAllotment, clearCart } =
    useCart();

  const [mode, setMode] = useState<Mode>("event");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedEventDate, setSelectedEventDate] = useState(
    events[0]?.date ?? "",
  );
  const [address, setAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliverySubmitted, setDeliverySubmitted] = useState(false);

  const totalSaucesSelected = Object.values(sauces).reduce((a, b) => a + b, 0);
  const paidSauces = Math.max(0, totalSaucesSelected - freeSauceAllotment);
  const grandTotalCents = totalCents + paidSauces * saucePriceCents;

  if (items.length === 0 && !deliverySubmitted) {
    return (
      <section className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <h1 className="font-display text-4xl font-semibold text-maroon">
          Checkout
        </h1>
        <p className="mt-3 text-maroon/70">Your cart is empty.</p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-terracotta px-6 py-3 font-semibold text-background transition-colors hover:bg-rust"
        >
          Shop the Menu
        </Link>
      </section>
    );
  }

  const orderPayload = {
    items,
    sauces,
    freeSauceAllotment,
    saucePriceCents,
    totalCents: grandTotalCents,
  };

  function buildWhatsAppMessage() {
    const lines = items.map((item) => {
      const flavorNote = item.flavors
        ? " (" +
          Object.entries(item.flavors)
            .filter(([, count]) => count > 0)
            .map(([flavor, count]) => `${count}x ${flavor}`)
            .join(", ") +
          ")"
        : "";
      return `${item.quantity}x ${item.name}${flavorNote}`;
    });
    if (totalSaucesSelected > 0) {
      lines.push(
        Object.entries(sauces)
          .filter(([, count]) => count > 0)
          .map(([flavor, count]) => `${count}x Sauce - ${flavor}`)
          .join(", "),
      );
    }
    return `Hi! I'd like to arrange pickup at your kitchen for:\n${lines.join("\n")}\nTotal: ${formatPrice(grandTotalCents)}`;
  }

  async function handleEventSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...orderPayload,
          eventDate: selectedEventDate,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      clearCart();
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  async function handleDeliverySubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...orderPayload,
          address,
          preferredDate,
          notes,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      clearCart();
      setDeliverySubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (deliverySubmitted) {
    return (
      <section className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <h1 className="font-display text-4xl font-semibold text-maroon">
          Request sent!
        </h1>
        <p className="mt-3 max-w-xl text-maroon/70">
          We got your delivery request and sent you a confirmation email.
          We&rsquo;ll follow up shortly with the delivery fee and a payment
          link.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-terracotta px-6 py-3 font-semibold text-background transition-colors hover:bg-rust"
        >
          Continue Shopping
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <h1 className="font-display text-4xl font-semibold text-maroon">
        Checkout
      </h1>

      <div className="mt-6 flex flex-wrap gap-2">
        {(["event", "house", "delivery"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-full border px-5 py-2 text-sm font-semibold transition-colors ${
              mode === m
                ? "border-terracotta bg-terracotta text-background"
                : "border-maroon/30 text-maroon hover:bg-maroon/5"
            }`}
          >
            {m === "event"
              ? "Pickup at an Event"
              : m === "house"
                ? "Pickup at Our Kitchen"
                : "Delivery"}
          </button>
        ))}
      </div>

      <div className="mt-8 rounded-3xl bg-cream p-6">
        <div className="flex items-center justify-between text-lg font-semibold text-maroon">
          <span>Order total</span>
          <span>{formatPrice(grandTotalCents)}</span>
        </div>
      </div>

      {mode === "event" && (
        <form onSubmit={handleEventSubmit} className="mt-8 flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-maroon/70">
              Pick an event
            </label>
            <select
              value={selectedEventDate}
              onChange={(e) => setSelectedEventDate(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-maroon/20 bg-background px-4 py-3 text-maroon"
            >
              {events.map((event) => (
                <option key={event.date} value={event.date}>
                  {event.venue} —{" "}
                  {new Date(`${event.date}T00:00:00`).toLocaleDateString(
                    "en-US",
                    { weekday: "short", month: "short", day: "numeric" },
                  )}
                  , {event.time}
                </option>
              ))}
            </select>
          </div>
          <ContactFields
            name={name}
            setName={setName}
            email={email}
            setEmail={setEmail}
            phone={phone}
            setPhone={setPhone}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-full bg-terracotta px-6 py-3 font-semibold text-background transition-colors hover:bg-rust disabled:opacity-50"
          >
            {submitting ? "Redirecting to payment…" : "Pay Now"}
          </button>
        </form>
      )}

      {mode === "house" && (
        <div className="mt-8 flex flex-col gap-4">
          <p className="text-maroon/70">
            Pick up at our kitchen: <strong>{PICKUP_ADDRESS}</strong>. Message
            us on WhatsApp to arrange a time and pay — we&rsquo;ll confirm
            details directly with you.
          </p>
          <a
            href={`https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent(buildWhatsAppMessage())}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => clearCart()}
            className="inline-block w-fit rounded-full bg-terracotta px-6 py-3 font-semibold text-background transition-colors hover:bg-rust"
          >
            Message on WhatsApp
          </a>
        </div>
      )}

      {mode === "delivery" && (
        <form
          onSubmit={handleDeliverySubmit}
          className="mt-8 flex flex-col gap-4"
        >
          <ContactFields
            name={name}
            setName={setName}
            email={email}
            setEmail={setEmail}
            phone={phone}
            setPhone={setPhone}
          />
          <div>
            <label className="text-sm font-medium text-maroon/70">
              Delivery address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-maroon/20 bg-background px-4 py-3 text-maroon"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-maroon/70">
              Preferred date
            </label>
            <input
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-maroon/20 bg-background px-4 py-3 text-maroon"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-maroon/70">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-maroon/20 bg-background px-4 py-3 text-maroon"
            />
          </div>
          <p className="text-sm text-maroon/60">
            No payment yet — we&rsquo;ll follow up with the delivery fee and a
            payment link once we&rsquo;ve confirmed your order.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-full bg-terracotta px-6 py-3 font-semibold text-background transition-colors hover:bg-rust disabled:opacity-50"
          >
            {submitting ? "Sending…" : "Request Delivery"}
          </button>
        </form>
      )}
    </section>
  );
}

function ContactFields({
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone,
}: {
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
}) {
  return (
    <>
      <div>
        <label className="text-sm font-medium text-maroon/70">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full rounded-xl border border-maroon/20 bg-background px-4 py-3 text-maroon"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-maroon/70">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 w-full rounded-xl border border-maroon/20 bg-background px-4 py-3 text-maroon"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-maroon/70">Phone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="mt-1 w-full rounded-xl border border-maroon/20 bg-background px-4 py-3 text-maroon"
        />
      </div>
    </>
  );
}
