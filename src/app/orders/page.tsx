"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/square";
import type { OrderSummary } from "@/lib/square";

function formatOrderDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function OrdersPage() {
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrders(null);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setOrders(data.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <h1 className="font-display text-4xl font-semibold text-maroon">
        My Orders
      </h1>
      <p className="mt-3 max-w-xl text-maroon/70">
        Enter the email you used at checkout to see your past orders paid
        online for event pickup. If you arranged pickup over WhatsApp or a
        custom delivery, check your email confirmation instead — those don&rsquo;t
        show up here.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 rounded-xl border border-maroon/20 bg-background px-4 py-3 text-maroon"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-terracotta px-6 py-3 font-semibold text-background transition-colors hover:bg-rust disabled:opacity-50"
        >
          {loading ? "Looking up…" : "Find my orders"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {orders && orders.length === 0 && (
        <p className="mt-8 text-maroon/60">
          No online orders found for that email.
        </p>
      )}

      {orders && orders.length > 0 && (
        <ul className="mt-8 flex flex-col gap-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-3xl bg-cream p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-maroon">
                  {formatOrderDate(order.createdAt)}
                </p>
                <p className="font-semibold text-maroon">
                  {formatPrice(order.totalCents)}
                </p>
              </div>
              <ul className="mt-3 flex flex-col gap-1 text-sm text-maroon/70">
                {order.lineItems.map((item, i) => (
                  <li key={i}>
                    {item.quantity}x {item.name}
                    {item.note ? ` (${item.note})` : ""}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/shop"
        className="mt-10 inline-block text-sm font-semibold text-terracotta hover:text-rust"
      >
        Order again →
      </Link>
    </section>
  );
}
