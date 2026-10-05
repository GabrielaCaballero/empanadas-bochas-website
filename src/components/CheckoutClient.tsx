"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import type { EventEntry } from "@/lib/events";
import { computeDeliveryFeeCents, type DeliveryZone } from "@/lib/delivery-pricing";
import { formatPrice } from "@/lib/square";
import { whatsAppUrl, PICKUP_ADDRESS } from "@/lib/business-info";
import { formatWeekendDate } from "@/lib/weekend-dates";
import type { DayOption } from "@/lib/availability";
import FreeDeliveryProgress from "@/components/FreeDeliveryProgress";

type TopChoice = "pickup" | "delivery";
type PickupChoice = "event" | "kitchen";

// Checked client-side for instant feedback before the round-trip to
// /api/checkout (which independently re-checks this server-side too — see
// docs/checkout-edge-cases.md). Native <input type="email"> does NOT
// require a dot after the @ per the HTML spec, so "name@gmail" passes
// browser validation but Square's API rejects it — this is what used to
// surface as an opaque "Could not create payment link".
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

// Kitchen pickup and delivery are weekend-only (event pickup isn't — it
// follows whatever pop-ups are on the calendar). Every upcoming weekend day
// is shown so customers can see WHY a day is closed (a pop-up that day, or
// the business marked it unavailable), but only open days can be chosen.
// Laid out as selectable day cards, not a calendar, since there are only a
// handful of days.
function WeekendDatePicker({
  options,
  mode,
  value,
  onChange,
  label,
}: {
  options: DayOption[];
  mode: "delivery" | "kitchen";
  value: string | null;
  onChange: (iso: string) => void;
  label: string;
}) {
  const anyOpen = options.some((o) => o[mode].available);
  return (
    <div>
      <label className="text-sm font-medium text-maroon/70">{label}</label>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((o) => {
          const channel = o[mode];
          const [weekdayLabel, dayLabel] = formatWeekendDate(o.date).split(",");
          return (
            <button
              key={o.date}
              type="button"
              disabled={!channel.available}
              onClick={() => onChange(o.date)}
              aria-pressed={value === o.date}
              className={`rounded-2xl border px-3 py-3 text-left transition-colors ${
                !channel.available
                  ? "cursor-not-allowed border-maroon/10 bg-maroon/5 opacity-60"
                  : value === o.date
                    ? "border-terracotta bg-terracotta/10"
                    : "border-maroon/20 hover:bg-maroon/5"
              }`}
            >
              <span className="block text-sm font-semibold text-maroon">
                {weekdayLabel}
              </span>
              <span className="block text-sm text-maroon/70">
                {dayLabel?.trim()}
              </span>
              {channel.available && channel.hours && (
                <span className="mt-1 block text-xs text-maroon/60">
                  {channel.hours}
                </span>
              )}
              {!channel.available && channel.reason && (
                <span className="mt-1 block text-xs leading-snug text-maroon/60">
                  {channel.reason}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {!anyOpen && (
        <p className="mt-2 text-sm text-red-600">
          No weekend days are open right now. Message us on WhatsApp and
          we&rsquo;ll sort something out.
        </p>
      )}
    </div>
  );
}

function WeekendNotice({ mode }: { mode: "delivery" | "kitchen" }) {
  return (
    <p className="rounded-2xl border border-terracotta/30 bg-terracotta/10 px-4 py-3 text-sm font-medium text-maroon">
      {mode === "delivery"
        ? "Delivery is available on Saturdays and Sundays. Pick a day below and we’ll confirm your time on WhatsApp."
        : "Kitchen pickup is available on weekends when we don’t have a pop-up. On pop-up days, pick up at the event instead. Pick a day below and we’ll confirm your time on WhatsApp."}
    </p>
  );
}

export default function CheckoutClient({
  events,
  deliveryZones,
  taxRate,
  taxName,
  weekendOptions,
}: {
  events: EventEntry[];
  deliveryZones: DeliveryZone[];
  weekendOptions: DayOption[];
  taxRate: number | null;
  taxName: string | null;
}) {
  const { items, totalCents } = useCart();

  const [topChoice, setTopChoice] = useState<TopChoice | null>(null);
  const [pickupChoice, setPickupChoice] = useState<PickupChoice | null>(null);
  const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
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
    setSelectedDate(null);
    setAddress("");
    setZipCode("");
  }
  function handlePickupChoiceChange(choice: PickupChoice) {
    setPickupChoice(choice);
    setSelectedEventIndex(null);
    setSelectedDate(null);
  }

  // Sauces (free, per-box, and any extras bought directly from the cart)
  // are already folded into each cart item's own price — see
  // cart-context.tsx and CartClient — so there's no separate sauce math
  // here.
  const grandTotalCents = totalCents;

  // Looked up live as the customer types their ZIP — a zone's postalCodes
  // list is the same data the price picker used to make them choose from
  // manually; matching against it directly means one address entry instead
  // of "pick your zone, then also type your address" as two separate steps.
  const matchedZone = useMemo(() => {
    if (zipCode.length !== 5) return undefined;
    return deliveryZones.find((z) => z.postalCodes.includes(zipCode));
  }, [zipCode, deliveryZones]);
  const matchedZoneFeeCents = matchedZone
    ? computeDeliveryFeeCents(matchedZone, grandTotalCents)
    : null;

  const selection = useMemo(() => {
    if (topChoice === "pickup" && pickupChoice === "kitchen" && selectedDate) {
      return { kind: "kitchen" as const, date: selectedDate };
    }
    if (
      topChoice === "pickup" &&
      pickupChoice === "event" &&
      selectedEventIndex !== null
    ) {
      const event = events[selectedEventIndex];
      return event ? { kind: "event" as const, event } : null;
    }
    if (topChoice === "delivery" && matchedZone && address && selectedDate) {
      return { kind: "delivery" as const, zone: matchedZone, date: selectedDate };
    }
    return null;
  }, [
    topChoice,
    pickupChoice,
    selectedEventIndex,
    selectedDate,
    matchedZone,
    address,
    events,
  ]);

  const deliveryFeeCents =
    selection?.kind === "delivery"
      ? computeDeliveryFeeCents(selection.zone, grandTotalCents)
      : 0;
  // Tax applies to the whole order Square actually builds — merchandise
  // plus the delivery line item, not just the merchandise subtotal — so
  // it's computed on top of both here, matching the scope: "ORDER" tax
  // Square itself applies (see createPaymentLink). This is an ESTIMATE for
  // the customer to see before paying; Square computes the real, final
  // amount when the order is actually created.
  const preTaxTotalCents = grandTotalCents + deliveryFeeCents;
  const taxCents = taxRate ? Math.round(preTaxTotalCents * taxRate) : 0;
  const orderTotalCents = preTaxTotalCents + taxCents;

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

    const trimmedEmail = email.trim();
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError(
        "That email address looks incomplete — please include a domain, like name@example.com.",
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          totalCents: grandTotalCents,
          customerName: name.trim(),
          customerEmail: trimmedEmail,
          customerPhone: phone.trim(),
          fulfillment:
            selection.kind === "event"
              ? {
                  kind: "event",
                  eventDate: selection.event.date,
                  venue: selection.event.venue,
                }
              : selection.kind === "kitchen"
                ? { kind: "kitchen", date: selection.date }
                : {
                    kind: "delivery",
                    zoneId: selection.zone.id,
                    address: `${address}, ${zipCode}`,
                    date: selection.date,
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
                ? [
                    {
                      value: "delivery" as TopChoice,
                      label: "Delivery",
                      sublabel: "Sat & Sun only",
                    },
                  ]
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
                  ? [
                      {
                        value: "event" as PickupChoice,
                        label: "At an Event",
                        sublabel: "any pop-up date",
                      },
                    ]
                  : []),
                {
                  value: "kitchen",
                  label: "At Our Kitchen",
                  sublabel: "Sat & Sun only",
                },
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

      {topChoice === "pickup" && pickupChoice === "kitchen" && (
        <div className="mt-4 flex flex-col gap-4">
          <WeekendNotice mode="kitchen" />
          <WeekendDatePicker
            options={weekendOptions}
            mode="kitchen"
            value={selectedDate}
            onChange={setSelectedDate}
            label="Choose a pickup day"
          />
        </div>
      )}

      {topChoice === "delivery" && (
        <div className="mt-4 flex flex-col gap-4">
          <WeekendNotice mode="delivery" />
          <FreeDeliveryProgress subtotalCents={grandTotalCents} />
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
                  {matchedZoneFeeCents === 0 ? (
                    <span className="font-bold text-green-600">Free</span>
                  ) : (
                    formatPrice(matchedZoneFeeCents)
                  )}
                </p>
              ) : (
                <div className="mt-2 flex flex-col gap-2">
                  <p className="text-sm text-red-600">
                    Looks like we don&rsquo;t have delivery to your zone yet —
                    you can choose to pick up or message us.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleTopChoiceChange("pickup")}
                      className="rounded-full border border-maroon/30 px-4 py-1.5 text-sm font-semibold text-maroon transition-colors hover:bg-maroon/5"
                    >
                      Switch to Pickup
                    </button>
                    <a
                      href={whatsAppUrl(
                        `Hi! I'd like to place a delivery order but I'm not sure you deliver to my ZIP code (${zipCode}). Can you help?`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-maroon/30 px-4 py-1.5 text-sm font-semibold text-maroon transition-colors hover:bg-maroon/5"
                    >
                      Message on WhatsApp
                    </a>
                  </div>
                </div>
              ))}
          </div>
          {matchedZone && (
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
          )}
          {matchedZone && (
            <WeekendDatePicker
              options={weekendOptions}
              mode="delivery"
              value={selectedDate}
              onChange={setSelectedDate}
              label="Choose a delivery day"
            />
          )}
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
            <span>
              {deliveryFeeCents === 0 ? (
                <span className="font-bold text-green-600">Free</span>
              ) : (
                formatPrice(deliveryFeeCents)
              )}
            </span>
          </div>
        )}
        {taxRate != null && (
          <div className="mt-1 flex items-center justify-between text-sm text-maroon/70">
            <span>
              {taxName ?? "Tax"} ({(Math.round(taxRate * 10000) / 100).toFixed(2)}%)
            </span>
            <span>{formatPrice(taxCents)}</span>
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
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">{error}</p>
              <p className="mt-1 text-sm text-red-700/80">
                Running into this more than once? We can take your order
                directly instead.
              </p>
              <a
                href={whatsAppUrl(
                  `Hi! I ran into an error trying to check out on the website: "${error}"`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                Message us on WhatsApp
              </a>
            </div>
          )}
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
          // type="email" alone accepts "name@gmail" (no TLD required per the
          // HTML spec) — this pattern is a second, stricter native check,
          // on top of the JS check in handlePaidSubmit.
          pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
          title="Include a domain, like name@example.com"
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
