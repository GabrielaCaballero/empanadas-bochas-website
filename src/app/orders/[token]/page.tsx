import Link from "next/link";
import { verifyOrderToken } from "@/lib/order-token";
import { getOrder, formatPrice } from "@/lib/square";
import { whatsAppUrl } from "@/lib/business-info";

function formatOrderDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function InvalidLink() {
  return (
    <section className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <h1 className="font-display text-4xl font-semibold text-maroon">
        We couldn&rsquo;t find that order
      </h1>
      <p className="mt-3 max-w-xl text-maroon/70">
        This link may be mistyped or out of date. Check your order
        confirmation email for the correct link, or message us on WhatsApp
        and we&rsquo;ll help track it down.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={whatsAppUrl("Hi! I'm trying to find my order but the link isn't working.")}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-terracotta px-6 py-3 font-semibold text-background transition-colors hover:bg-rust"
        >
          Message us on WhatsApp
        </a>
        <Link
          href="/shop"
          className="rounded-full border border-maroon/20 px-6 py-3 font-semibold text-maroon transition-colors hover:bg-maroon/5"
        >
          Shop the Menu
        </Link>
      </div>
    </section>
  );
}

export default async function OrderTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const orderId = verifyOrderToken(token);
  const order = orderId ? await getOrder(orderId) : null;

  if (!order) return <InvalidLink />;

  return (
    <section className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <h1 className="font-display text-4xl font-semibold text-maroon">
        Your order
      </h1>
      <p className="mt-3 text-maroon/70">
        Placed {formatOrderDate(order.createdAt)}
      </p>

      <div className="mt-8 rounded-3xl bg-cream p-6">
        <p className="text-sm font-medium text-maroon/60">Order summary</p>
        <ul className="mt-2 flex flex-col gap-1 text-sm text-maroon/80">
          {order.lineItems.map((item, i) => (
            <li key={i}>
              {item.quantity}x {item.name}
              {item.note ? ` (${item.note})` : ""}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-maroon/10 pt-3 font-semibold text-maroon">
          <span>Total</span>
          <span>{formatPrice(order.totalCents)}</span>
        </div>
      </div>

      <p className="mt-6 text-sm text-maroon/60">
        Questions about this order?{" "}
        <a
          href={whatsAppUrl(`Hi! I have a question about my order (${formatOrderDate(order.createdAt)}).`)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-terracotta hover:text-rust"
        >
          Message us on WhatsApp
        </a>
      </p>

      <Link
        href="/shop"
        className="mt-8 inline-block text-sm font-semibold text-terracotta hover:text-rust"
      >
        Order again →
      </Link>
    </section>
  );
}
