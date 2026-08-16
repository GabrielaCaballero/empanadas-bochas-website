"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import type { EventEntry } from "@/lib/events";
import { computeDeliveryFeeCents, type DeliveryZone } from "@/lib/delivery-pricing";
import { formatPrice } from "@/lib/square";
import { PICKUP_ADDRESS } from "@/lib/business-info";

type TopChoice = "pickup" | "delivery";
type PickupChoice = "event" | "kitchen";

function formatEventOptionLabel(event: EventEntry) {
  const date = new Date(`${event.date}T00:00:00`).toLocaleDateString(
    "en-US",
    { weekday: "short", month: "short", day: "numeric" },
  );
  return `${event.venue} — ${date}, ${event.time}`;
}

function normalizeZip(raw: string) {
  return raw.replace(/\D/g, "").slice(0, 5);
}

function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; sublabel?: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-full border px-5 py-2 text-left text-sm font-semibold transition-colors ${
            value === opt.value
              ? "border-terracotta bg-terracotta text-background"
              : "border-maroon/30 text-maroon hover:bg-maroon/5"
          }`}
        >
          {opt.label}
          {opt.sublabel && (
            <span
              className={
                value === opt.value ? "ml-1.5 opacity-80" : "ml-1.5 text-maroon/50"
              }
            >
              — {opt.sublabel}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export default function CheckoutClient({
  saucePriceCents,
  events,
  deliveryZones,
}: {
  saucePriceCents: number;
  events: EventEntry[];
  deliveryZones: DeliveryZone[];
}) {
  const { items, sauces, totalCents, freeSauceAllotment } = useCart();

  const [topChoice, setTopChoice] = useState<TopChoice | null>(null);
  const [pickupChoice, setPickupChoice] = useState<PickupChoice | null>(null);
  const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(
    null,
  );
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If the browser restores this page from the back-forward cache (e.g.
    // the customer hits "back" from Square without paying), it resurrects
    // whatever state was frozen when we navigated away — including
    // "submitting", which would otherwise leave the button stuck reading
    // "Redirecting to payment…" forever even though nothing is happening.
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        setSubmitting(false);
      }
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // A single event with no other events on the same date has a unique enough
  // date to key on, but two events can share a date (different venues), so
  // selection is tracked by array index rather than date.
  function handleTopChoiceChange(choice: TopChoice) {
    setTopChoice(choice);
    setPickupChoice(null);
    setSelectedEventIndex(null);
    setAddress("");
    setZipCode("");
  }
  function handlePickupChoiceChange(choice: PickupChoice) {
    setPickupChoice(choice);
    setSelectedEventIndex(null);
  }

  const totalSaucesSelected = Object.values(sauces).reduce((a, b) => a + b, 0);
  const paidSauces = Math.max(0, totalSaucesSelected - freeSauceAllotment);
  const grandTotalCents = totalCents + paidSauces * saucePriceCents;

  // Looked up live as the customer types their ZIP — a zone's postalCodes
  // list is the same data the price picker used to make them choose from
  // manually; matching against it directly means one address entry instead
  // of "pick your zone, then also type your address" as two separate steps.
  const matchedZone = useMemo(() => {
    if (zipCode.length !== 5) return undefined;
    return deliveryZones.find((z) => z.postalCodes.includes(zipCode));
  }, [zipCode, deliveryZones]);

  const selection = useMemo(() => {
    if (topChoice === "pickup" && pickupChoice === "kitchen") {
      return { kind: "kitchen" as const };
    }
    if (
      topChoice === "pickup" &&
      pickupChoice === "event" &&
      selectedEventIndex !== null
    ) {
      const event = events[selectedEventIndex];
      return event ? { kind: "event" as const, event } : null;
    }
    if (topChoice === "delivery" && matchedZone && address) {
      return { kind: "delivery" as const, zone: matchedZone };
    }
    return null;
  }, [topChoice, pickupChoice, selectedEventIndex, matchedZone, address, events]);

  const deliveryFeeCents =
    selection?.kind === "delivery"
      ? computeDeliveryFeeCents(selection.zone, grandTotalCents)
      : 0;
  const orderTotalCents = grandTotalCents + deliveryFeeCents;

  if (items.length === 0) {
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

  async function handlePaidSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selection) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          sauces,
          freeSauceAllotment,
          saucePriceCents,
          totalCents: grandTotalCents,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          fulfillment:
            selection.kind === "event"
              ? {
                  kind: "event",
                  eventDate: selection.event.date,
                  venue: selection.event.venue,
                }
              : selection.kind === "kitchen"
                ? { kind: "kitchen" }
                : {
                    kind: "delivery",
                    zoneId: selection.zone.id,
                    address: `${address}, ${zipCode}`,
                  },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      // Cart stays intact until payment is actually confirmed — cleared on
      // /checkout/success once Square redirects back after a real charge.
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <h1 className="font-display text-4xl font-semibold text-maroon">
        Checkout
      </h1>

      <div className="mt-8">
        <label className="text-sm font-medium text-maroon/70">
          How would you like to get your order?
        </label>
        <div className="mt-2">
          <PillGroup
            options={[
              { value: "pickup", label: "Pickup" },
              ...(deliveryZones.length > 0
                ? [{ value: "delivery" as TopChoice, label: "Delivery" }]
                : []),
            ]}
            value={topChoice}
            onChange={handleTopChoiceChange}
          />
        </div>
      </div>

      {topChoice === "pickup" && (
        <div className="mt-4">
          <label className="text-sm font-medium text-maroon/70">
            Where would you like to pick up?
          </label>
          <div className="mt-2">
            <PillGroup
              options={[
                ...(events.length > 0
                  ? [{ value: "event" as PickupChoice, label: "At an Event" }]
                  : []),
                { value: "kitchen", label: "At Our Kitchen" },
              ]}
              value={pickupChoice}
              onChange={handlePickupChoiceChange}
            />
          </div>
        </div>
      )}

      {topChoice === "pickup" && pickupChoice === "event" && (
        <div className="mt-4">
          <label className="text-sm font-medium text-maroon/70">
            Pick an event
          </label>
          <select
            value={selectedEventIndex ?? ""}
            onChange={(e) => setSelectedEventIndex(Number(e.target.value))}
            required
            className="mt-1 w-full rounded-xl border border-maroon/20 bg-background px-4 py-3 text-maroon"
          >
            <option value="" disabled>
              Select an event…
            </option>
            {events.map((event, index) => (
              <option key={index} value={index}>
                {formatEventOptionLabel(event)}
              </option>
            ))}
          </select>
        </div>
      )}

      {topChoice === "delivery" && (
        <div className="mt-4 flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-maroon/70">
              Delivery address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address, apt #"
              required
              className="mt-1 w-full rounded-xl border border-maroon/20 bg-background px-4 py-3 text-maroon"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-maroon/70">
              ZIP code
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={zipCode}
              onChange={(e) => setZipCode(normalizeZip(e.target.value))}
              placeholder="11101"
              required
              className="mt-1 w-full max-w-40 rounded-xl border border-maroon/20 bg-background px-4 py-3 text-maroon"
            />
            {zipCode.length === 5 &&
              (matchedZone ? (
                <p className="mt-2 text-sm text-maroon/70">
                  {matchedZone.neighborhood}, {matchedZone.borough} — delivery
                  is{" "}
                  {(() => {
                    const feeCents = computeDeliveryFeeCents(
                      matchedZone,
                      grandTotalCents,
                    );
                    return feeCents === 0 ? "Free" : formatPrice(feeCents);
                  })()}
                </p>
              ) : (
                <p className="mt-2 text-sm text-red-600">
                  We don&rsquo;t currently deliver to that ZIP code.
                </p>
              ))}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-3xl bg-cream p-6">
        <div className="flex items-center justify-between text-lg font-semibold text-maroon">
          <span>Order total</span>
          <span>{formatPrice(orderTotalCents)}</span>
        </div>
        {selection?.kind === "delivery" && (
          <div className="mt-1 flex items-center justify-between text-sm text-maroon/70">
            <span>Delivery</span>
            <span>{deliveryFeeCents === 0 ? "Free" : formatPrice(deliveryFeeCents)}</span>
          </div>
        )}
      </div>

      {selection?.kind === "kitchen" && (
        <p className="mt-8 text-maroon/70">
          Pick up at our kitchen: <strong>{PICKUP_ADDRESS}</strong>. Pay now,
          then message us on WhatsApp to schedule a pickup time.
        </p>
      )}

      {selection && (
        <form onSubmit={handlePaidSubmit} className="mt-8 flex flex-col gap-4">
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
