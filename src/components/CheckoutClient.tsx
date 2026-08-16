"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import type { EventEntry } from "@/lib/events";
import {
  computeDeliveryFeeCents,
  FREE_DELIVERY_THRESHOLD_CENTS,
  type DeliveryZone,
} from "@/lib/delivery-pricing";
import { formatPrice } from "@/lib/square";
import { whatsAppUrl, PICKUP_ADDRESS } from "@/lib/business-info";

type TopChoice = "pickup" | "delivery";
type PickupChoice = "event" | "kitchen";

function formatEventOptionLabel(event: EventEntry) {
  const date = new Date(`${event.date}T00:00:00`).toLocaleDateString(
    "en-US",
    { weekday: "short", month: "short", day: "numeric" },
  );
  return `${event.venue} — ${date}, ${event.time}`;
}

function boroughEstimateLabel(zones: DeliveryZone[], cartSubtotalCents: number) {
  if (cartSubtotalCents >= FREE_DELIVERY_THRESHOLD_CENTS) return "Free";
  const minCents = Math.min(...zones.map((z) => z.priceCents));
  return minCents === 0 ? "From Free" : `From ${formatPrice(minCents)}`;
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
  const { items, sauces, totalCents, freeSauceAllotment, clearCart } =
    useCart();

  const [topChoice, setTopChoice] = useState<TopChoice | null>(null);
  const [pickupChoice, setPickupChoice] = useState<PickupChoice | null>(null);
  const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(
    null,
  );
  const [selectedBorough, setSelectedBorough] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

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
    setSelectedBorough(null);
    setSelectedZoneId(null);
  }
  function handlePickupChoiceChange(choice: PickupChoice) {
    setPickupChoice(choice);
    setSelectedEventIndex(null);
  }
  function handleBoroughChange(borough: string) {
    setSelectedBorough(borough);
    setSelectedZoneId(null);
  }

  const totalSaucesSelected = Object.values(sauces).reduce((a, b) => a + b, 0);
  const paidSauces = Math.max(0, totalSaucesSelected - freeSauceAllotment);
  const grandTotalCents = totalCents + paidSauces * saucePriceCents;

  const deliveryZonesByBorough = useMemo(() => {
    const groups: { borough: string; zones: DeliveryZone[] }[] = [];
    for (const zone of deliveryZones) {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.borough === zone.borough) {
        lastGroup.zones.push(zone);
      } else {
        groups.push({ borough: zone.borough, zones: [zone] });
      }
    }
    return groups;
  }, [deliveryZones]);

  const zonesInSelectedBorough = useMemo(
    () => deliveryZones.filter((z) => z.borough === selectedBorough),
    [deliveryZones, selectedBorough],
  );

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
    if (topChoice === "delivery" && selectedZoneId) {
      const zone = deliveryZones.find((z) => z.id === selectedZoneId);
      return zone ? { kind: "delivery" as const, zone } : null;
    }
    return null;
  }, [topChoice, pickupChoice, selectedEventIndex, selectedZoneId, events, deliveryZones]);

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

  async function handlePaidSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selection || selection.kind === "kitchen") return;
    if (selection.kind === "delivery" && !address) return;

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
              : { kind: "delivery", zoneId: selection.zone.id, address },
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
        <div className="mt-4">
          <label className="text-sm font-medium text-maroon/70">
            Choose your borough
          </label>
          <div className="mt-2">
            <PillGroup
              options={deliveryZonesByBorough.map(({ borough, zones }) => ({
                value: borough,
                label: borough,
                sublabel: boroughEstimateLabel(zones, grandTotalCents),
              }))}
              value={selectedBorough}
              onChange={handleBoroughChange}
            />
          </div>
        </div>
      )}

      {topChoice === "delivery" && selectedBorough && (
        <div className="mt-4">
          <label className="text-sm font-medium text-maroon/70">
            Choose your neighborhood
          </label>
          <select
            value={selectedZoneId ?? ""}
            onChange={(e) => setSelectedZoneId(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-maroon/20 bg-background px-4 py-3 text-maroon"
          >
            <option value="" disabled>
              Select a neighborhood…
            </option>
            {zonesInSelectedBorough.map((zone) => {
              const feeCents = computeDeliveryFeeCents(zone, grandTotalCents);
              return (
                <option key={zone.id} value={zone.id}>
                  {zone.neighborhood} —{" "}
                  {feeCents === 0 ? "Free" : formatPrice(feeCents)}
                </option>
              );
            })}
          </select>
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
        <div className="mt-8 flex flex-col gap-4">
          <p className="text-maroon/70">
            Pick up at our kitchen: <strong>{PICKUP_ADDRESS}</strong>. Message
            us on WhatsApp to arrange a time and pay — we&rsquo;ll confirm
            details directly with you.
          </p>
          <a
            href={whatsAppUrl(buildWhatsAppMessage())}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => clearCart()}
            className="inline-block w-fit rounded-full bg-terracotta px-6 py-3 font-semibold text-background transition-colors hover:bg-rust"
          >
            Message on WhatsApp
          </a>
        </div>
      )}

      {(selection?.kind === "event" || selection?.kind === "delivery") && (
        <form onSubmit={handlePaidSubmit} className="mt-8 flex flex-col gap-4">
          <ContactFields
            name={name}
            setName={setName}
            email={email}
            setEmail={setEmail}
            phone={phone}
            setPhone={setPhone}
          />
          {selection.kind === "delivery" && (
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
          )}
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
