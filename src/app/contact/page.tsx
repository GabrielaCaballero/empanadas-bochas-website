const details = [
  {
    label: "Email",
    value: "empanadasbochas@gmail.com",
    href: "mailto:empanadasbochas@gmail.com",
    icon: "✉️",
  },
  {
    label: "Phone / WhatsApp",
    value: "+1 (917) 830-3570",
    href: "tel:+19178303570",
    icon: "📞",
  },
  {
    label: "Instagram",
    value: "@empanadasbochas",
    href: "https://www.instagram.com/empanadasbochas/",
    icon: "📷",
  },
  {
    label: "Pickup location",
    value: "45-21 45th Street, Long Island City, NY 11104",
    href: "https://maps.google.com/?q=45-21+45th+Street,+Long+Island+City,+NY+11104",
    icon: "📍",
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

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {details.map((detail) => (
          <a
            key={detail.label}
            href={detail.href}
            target={detail.href.startsWith("http") ? "_blank" : undefined}
            rel={
              detail.href.startsWith("http")
                ? "noopener noreferrer"
                : undefined
            }
            className="flex items-center gap-4 rounded-3xl bg-cream p-6 shadow-sm transition-shadow duration-300 hover:shadow-lg"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-terracotta/15 text-2xl">
              {detail.icon}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-maroon/60">
                {detail.label}
              </p>
              <p className="mt-0.5 font-semibold text-maroon break-words">
                {detail.value}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
