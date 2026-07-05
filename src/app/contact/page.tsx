const details = [
  {
    label: "Email",
    value: "empanadasbochas@gmail.com",
    href: "mailto:empanadasbochas@gmail.com",
  },
  {
    label: "Phone / WhatsApp",
    value: "+1 (917) 830-3570",
    href: "tel:+19178303570",
  },
  {
    label: "Instagram",
    value: "@empanadasbochas",
    href: "https://www.instagram.com/empanadasbochas/",
  },
  {
    label: "Pickup location",
    value: "45-21 45th Street, Long Island City, NY 11104",
    href: "https://maps.google.com/?q=45-21+45th+Street,+Long+Island+City,+NY+11104",
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

      <dl className="mt-10 grid max-w-xl grid-cols-1 gap-6 sm:grid-cols-2">
        {details.map((detail) => (
          <div key={detail.label}>
            <dt className="text-sm font-medium text-maroon/60">
              {detail.label}
            </dt>
            <dd className="mt-1">
              <a
                href={detail.href}
                target={detail.href.startsWith("http") ? "_blank" : undefined}
                rel={
                  detail.href.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                className="font-medium text-terracotta hover:text-rust"
              >
                {detail.value}
              </a>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
