import Image from "next/image";
import NycSkyline from "@/components/NycSkyline";
import {
  BUSINESS_INSTAGRAM,
  BUSINESS_EMAIL_PUBLIC,
  PICKUP_ADDRESS,
  whatsAppUrl,
} from "@/lib/business-info";

function EnvelopeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" />
      <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.67c2.24 0 4.35.87 5.94 2.46a8.3 8.3 0 0 1 2.45 5.92c0 4.63-3.77 8.4-8.4 8.4a8.4 8.4 0 0 1-4.28-1.17l-.31-.18-3.11.82.83-3.03-.2-.31a8.34 8.34 0 0 1-1.29-4.47c0-4.63 3.77-8.4 8.4-8.4Zm-3.16 4.19c-.18 0-.47.07-.71.34-.24.27-.93.91-.93 2.22 0 1.31.95 2.57 1.08 2.75.13.18 1.85 2.83 4.49 3.96.63.27 1.12.43 1.5.55.63.2 1.2.17 1.65.1.5-.08 1.55-.63 1.77-1.24.22-.61.22-1.13.15-1.24-.07-.11-.25-.18-.53-.31-.27-.13-1.62-.8-1.87-.89-.25-.09-.43-.13-.62.13-.18.27-.71.89-.87 1.07-.16.18-.32.2-.6.07-.27-.13-1.14-.42-2.17-1.34-.8-.72-1.34-1.6-1.5-1.87-.15-.27-.02-.42.12-.55.12-.12.27-.32.4-.48.13-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.13-.6-1.5-.83-2.05-.22-.53-.44-.46-.6-.47Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 2c-2.17 0-2.444.01-3.297.048-.852.04-1.433.174-1.942.372a3.92 3.92 0 0 0-1.417.923 3.92 3.92 0 0 0-.923 1.417c-.198.51-.333 1.09-.372 1.942C2.01 7.556 2 7.83 2 10s.01 2.444.048 3.297c.04.852.174 1.433.372 1.942.204.526.478.972.923 1.417.445.445.891.719 1.417.923.51.198 1.09.333 1.942.372C7.556 17.99 7.83 18 10 18s2.444-.01 3.297-.048c.852-.04 1.433-.174 1.942-.372a3.92 3.92 0 0 0 1.417-.923c.445-.445.719-.891.923-1.417.198-.51.333-1.09.372-1.942C17.99 12.444 18 12.17 18 10s-.01-2.444-.048-3.297c-.04-.852-.174-1.433-.372-1.942a3.92 3.92 0 0 0-.923-1.417 3.92 3.92 0 0 0-1.417-.923c-.51-.198-1.09-.333-1.942-.372C12.444 2.01 12.17 2 10 2Zm0 1.8c2.134 0 2.388.008 3.23.046.78.036 1.204.166 1.486.276.373.145.64.318.92.598.28.28.453.547.598.92.11.282.24.706.276 1.486.038.842.046 1.096.046 3.23s-.008 2.388-.046 3.23c-.036.78-.166 1.204-.276 1.486a2.47 2.47 0 0 1-.598.92c-.28.28-.547.453-.92.598-.282.11-.706.24-1.486.276-.842.038-1.096.046-3.23.046s-2.388-.008-3.23-.046c-.78-.036-1.204-.166-1.486-.276a2.47 2.47 0 0 1-.92-.598 2.47 2.47 0 0 1-.598-.92c-.11-.282-.24-.706-.276-1.486C3.808 12.388 3.8 12.134 3.8 10s.008-2.388.046-3.23c.036-.78.166-1.204.276-1.486.145-.373.318-.64.598-.92.28-.28.547-.453.92-.598.282-.11.706-.24 1.486-.276.842-.038 1.096-.046 3.23-.046Zm0 3.067A3.133 3.133 0 1 0 10 13.133 3.133 3.133 0 0 0 10 6.867Zm0 5.166A2.033 2.033 0 1 1 10 7.967a2.033 2.033 0 0 1 0 4.066Zm3.988-5.293a.733.733 0 1 1 0-1.466.733.733 0 0 1 0 1.466Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18s6-5.686 6-10a6 6 0 1 0-12 0c0 4.314 6 10 6 10Zm0-7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

const details = [
  {
    label: "Email",
    value: BUSINESS_EMAIL_PUBLIC,
    href: `mailto:${BUSINESS_EMAIL_PUBLIC}`,
    icon: <EnvelopeIcon />,
  },
  {
    label: "WhatsApp",
    value: "Message us directly",
    href: whatsAppUrl("Hi! I have a question about Empanadas Bochas."),
    icon: <WhatsAppIcon />,
  },
  {
    label: "Instagram",
    value: "@empanadasbochas",
    href: BUSINESS_INSTAGRAM,
    icon: <InstagramIcon />,
  },
];

export default function ContactPage() {
  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
      <h1 className="font-display text-4xl font-semibold text-maroon">
        Contact
      </h1>
      <p className="mt-3 max-w-xl text-maroon/70">
        Questions about an order, catering, or just want to say hi? Reach out
        any of these ways — we usually reply within a day.
      </p>

      {/* Banner */}
      <div className="relative mt-10 overflow-hidden rounded-t-3xl bg-gradient-to-br from-maroon to-rust px-6 pt-8 pb-16 sm:px-10 sm:pt-10 sm:pb-20">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-6 right-24 h-16 w-16 rounded-full bg-cream/20 blur-2xl" />
          <div className="absolute top-16 right-52 h-10 w-10 rounded-full bg-terracotta/30 blur-xl" />
          <div className="absolute bottom-20 right-10 h-20 w-20 rounded-full bg-cream/10 blur-2xl" />
        </div>

        <NycSkyline className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full text-background/10 sm:h-24" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-background sm:h-24" />

        <div className="pointer-events-none absolute right-6 bottom-8 h-20 w-20 rotate-6 overflow-hidden rounded-full shadow-2xl ring-4 ring-cream/30 sm:right-10 sm:bottom-10 sm:h-28 sm:w-28">
          <Image
            src="/photos/empanada-5.png"
            alt=""
            fill
            className="object-cover"
            sizes="112px"
          />
        </div>

        <div className="relative z-10">
          <span className="text-4xl sm:text-5xl">👋</span>
          <h2 className="mt-3 font-display text-2xl font-semibold text-cream sm:text-3xl">
            Let&rsquo;s talk empanadas
          </h2>
          <p className="mt-1 max-w-[70%] text-sm text-cream/80 sm:max-w-sm sm:text-base">
            Custom orders, catering, or just craving something — we&rsquo;d love
            to hear from you.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-b-3xl bg-cream px-6 pt-6 pb-6 sm:grid-cols-3 sm:px-8">
        {details.map((detail) => (
          <a
            key={detail.label}
            href={detail.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-2xl bg-background p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta transition-colors group-hover:bg-terracotta/20 group-hover:text-rust">
              {detail.icon}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-maroon/60">
                {detail.label}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-maroon break-words underline decoration-maroon/0 group-hover:decoration-maroon/30">
                {detail.value}
              </p>
            </div>
          </a>
        ))}
      </div>

      {/* Pickup / map */}
      <div className="mt-6 overflow-hidden rounded-3xl bg-cream shadow-sm">
        <div className="flex items-center gap-3 p-6 pb-0">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
            <PinIcon />
          </span>
          <div>
            <p className="text-sm font-medium text-maroon/60">
              Pickup kitchen
            </p>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(PICKUP_ADDRESS)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-terracotta underline decoration-terracotta/40 underline-offset-2 hover:text-rust hover:decoration-rust/50"
            >
              {PICKUP_ADDRESS}
            </a>
          </div>
        </div>
        <iframe
          title="Map to Empanadas Bochas pickup kitchen"
          src={`https://www.google.com/maps?q=${encodeURIComponent(PICKUP_ADDRESS)}&output=embed`}
          className="mt-6 h-72 w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </section>
  );
}
