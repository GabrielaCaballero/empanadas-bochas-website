import type { Metadata } from "next";
import Image from "next/image";
import CateringForm from "@/components/CateringForm";
import { BUSINESS_EMAIL_PUBLIC } from "@/lib/business-info";

export const metadata: Metadata = {
  title: "Catering & Private Events",
  description:
    "Argentine empanada catering in NYC for corporate lunches, birthdays, and private events. Tell us about your event and we'll get back to you.",
  alternates: { canonical: "/catering" },
};

const OCCASIONS = [
  {
    icon: "💼",
    title: "Corporate & office events",
    body: "Team lunches, client meetings, and office celebrations. Handmade empanadas that people actually remember.",
  },
  {
    icon: "🎂",
    title: "Birthdays & private parties",
    body: "Birthdays, baby showers, family gatherings. Empanadas are made for sharing.",
  },
  {
    icon: "🔁",
    title: "Something regular",
    body: "Thinking of a weekly office lunch or a recurring order? Tell us what you have in mind.",
  },
];

const STEPS = [
  "Tell us about your event: the date, the number of guests, anything we should know.",
  "We reply by email with options and pricing.",
  "We confirm the details and bake for your date.",
];

export default function CateringPage() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="bg-cream px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="rounded-full bg-terracotta/10 px-4 py-1 text-sm font-semibold text-terracotta">
            Catering &amp; private events
          </span>
          <h1 className="mt-5 font-display text-4xl font-semibold text-maroon sm:text-5xl">
            Empanadas for your team, your party, your big day
          </h1>
          <p className="mt-4 text-lg text-maroon/75">
            Planning something? Tell us about it and we&rsquo;ll get back to
            you by email with options and pricing.
          </p>
          <a
            href="#inquiry"
            className="mt-8 inline-block rounded-full bg-terracotta px-6 py-3 font-semibold text-background transition-colors hover:bg-rust"
          >
            Ask about your event
          </a>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <h2 className="font-display text-3xl font-semibold text-maroon">
          What we cater
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {OCCASIONS.map((o) => (
            <div key={o.title} className="rounded-3xl bg-cream p-6">
              <span className="text-3xl">{o.icon}</span>
              <h3 className="mt-3 font-display text-xl font-semibold text-maroon">
                {o.title}
              </h3>
              <p className="mt-2 text-maroon/70">{o.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-cream">
            <Image
              src="/photos/event-1.webp"
              alt="Our table at a pop-up event, stacked with empanadas"
              fill
              className="object-cover"
              sizes="(min-width: 640px) 50vw, 100vw"
            />
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-cream">
            <Image
              src="/photos/event-2.webp"
              alt="Empanadas Bochas table with our logo runner"
              fill
              className="object-cover"
              sizes="(min-width: 640px) 50vw, 100vw"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-16">
        <h2 className="font-display text-3xl font-semibold text-maroon">
          How it works
        </h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-terracotta font-semibold text-background">
                {i + 1}
              </span>
              <p className="pt-1.5 text-maroon/75">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        id="inquiry"
        className="mx-auto w-full max-w-3xl scroll-mt-20 px-6 pb-24"
      >
        <h2 className="font-display text-3xl font-semibold text-maroon">
          Tell us about your event
        </h2>
        <p className="mt-2 text-maroon/70">
          Prefer email? Write to{" "}
          <a
            href={`mailto:${BUSINESS_EMAIL_PUBLIC}`}
            className="font-semibold text-terracotta underline decoration-terracotta/40 underline-offset-2 hover:text-rust"
          >
            {BUSINESS_EMAIL_PUBLIC}
          </a>
          .
        </p>
        <div className="mt-8">
          <CateringForm />
        </div>
      </section>
    </div>
  );
}
