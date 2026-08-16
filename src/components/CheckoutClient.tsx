"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import type { EventEntry } from "@/lib/events";
import {
  computeDeliveryFeeCents,
  type DeliveryZone,
} from "@/lib/delivery-pricing";
import { formatPrice } from "@/lib/square";
import { whatsAppUrl, PICKUP_ADDRESS } from "@/lib/business-info";

const EVENT_KEY_PREFIX = "event:";
const DELIVERY_KEY_PREFIX = "delivery:";
const KITCHEN_KEY = "kitchen";

// Events are identified by their position in the list, not by date — two
// events can legitimately share a date (different venues), so date alone
// isn't a unique key.
function eventKey(index: number) {
  return `${EVENT_KEY_PREFIX}${index}`;
}
function deliveryKey(zoneId: string) {
  return `${DELIVERY_KEY_PREFIX}${zoneId}`;
}

function formatEventOptionLabel(event: EventEntry) {
  const date = new Date(`${event.date}T00:00:00`).toLocaleDateString(
    "en-US",
    { weekday: "short", month: "short", day: "numeric" },
  );
  return `${event.venue} — ${date}, ${event.time} — Free`;
}

function formatDeliveryOptionLabel(zone: DeliveryZone, feeCents: number) {
  const feeLabel = feeCents === 0 ? "Free" : formatPrice(feeCents);
  return `${zone.neighborhood} — ${feeLabel}`;
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

  const [selectedKey, setSelectedKey] = useState(
    events[0] ? eventKey(0) : KITCHEN_KEY,
  );
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

  const totalSaucesSelected = Object.values(sauces).reduce((a, b) => a + b, 0);
  const paidSauces = Math.max(0, totalSaucesSelected - freeSauceAllotment);
  const grandTotalCents = totalCents + paidSauces * saucePriceCents;

  const selection = useMemo(() => {
    if (selectedKey === KITCHEN_KEY) return { kind: "kitchen" as const };
    if (selectedKey.startsWith(EVENT_KEY_PREFIX)) {
      const index = Number(selectedKey.slice(EVENT_KEY_PREFIX.length));
      return { kind: "event" as const, event: events[index] };
    }
    const zoneId = selectedKey.slice(DELIVERY_KEY_PREFIX.length);
    return {
      kind: "delivery" as const,
      zone: deliveryZones.find((z) => z.id === zoneId),
    };
  }, [selectedKey, events, deliveryZones]);

  const deliveryFeeCents =
    selection.kind === "delivery" && selection.zone
      ? computeDeliveryFeeCents(selection.zone, grandTotalCents)
      : 0;
  const orderTotalCents = grandTotalCents + deliveryFeeCents;

  // Delivery zones are grouped by borough for the picker; the sheet already
  // returns them borough-clustered, so grouping just needs to track when the
  // borough changes rather than re-sorting.
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
    if (selection.kind === "kitchen") return;
    if (selection.kind === "event" && !selection.event) return;
    if (selection.kind === "delivery" && (!selection.zone || !address)) return;

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
                  eventDate: selection.event!.date,
                  venue: selection.event!.venue,
                }
              : { kind: "delivery", zoneId: selection.zone!.id, address },
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
        <select
          value={selectedKey}
          onChange={(e) => setSelectedKey(e.target.value)}
          className="mt-1 w-full rounded-xl border border-maroon/20 bg-background px-4 py-3 text-maroon"
        >
          {events.length > 0 && (
            <optgroup label="Pickup at an Event">
              {events.map((event, index) => (
                <option key={eventKey(index)} value={eventKey(index)}>
                  {formatEventOptionLabel(event)}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label="Pickup at Our Kitchen">
            <option value={KITCHEN_KEY}>
              Our Kitchen, {PICKUP_ADDRESS} — Free
            </option>
          </optgroup>
          {deliveryZonesByBorough.map(({ borough, zones }) => (
            <optgroup key={borough} label={`Delivery — ${borough}`}>
              {zones.map((zone) => (
                <option key={zone.id} value={deliveryKey(zone.id)}>
                  {formatDeliveryOptionLabel(
                    zone,
                    computeDeliveryFeeCents(zone, grandTotalCents),
                  )}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="mt-6 rounded-3xl bg-cream p-6">
        <div className="flex items-center justify-between text-lg font-semibold text-maroon">
          <span>Order total</span>
          <span>{formatPrice(orderTotalCents)}</span>
        </div>
        {selection.kind === "delivery" && selection.zone && (
          <div className="mt-1 flex items-center justify-between text-sm text-maroon/70">
            <span>Delivery</span>
            <span>{deliveryFeeCents === 0 ? "Free" : formatPrice(deliveryFeeCents)}</span>
          </div>
        )}
      </div>

      {selection.kind === "kitchen" && (
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

      {(selection.kind === "event" || selection.kind === "delivery") && (
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
