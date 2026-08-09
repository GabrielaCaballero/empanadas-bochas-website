import Link from "next/link";
import { whatsAppUrl } from "@/lib/business-info";

export default function OrdersPage() {
  return (
    <section className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <h1 className="font-display text-4xl font-semibold text-maroon">
        My Orders
      </h1>
      <p className="mt-3 max-w-xl text-maroon/70">
        Every order paid online comes with a private link to that order in
        your confirmation email — that&rsquo;s the fastest way to look one up.
        If you arranged pickup over WhatsApp or a custom delivery, check that
        email confirmation instead.
      </p>
      <p className="mt-3 max-w-xl text-maroon/70">
        Can&rsquo;t find the email, or something looks off? Message us and
        we&rsquo;ll help.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={whatsAppUrl("Hi! I'm trying to find a past order.")}
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
