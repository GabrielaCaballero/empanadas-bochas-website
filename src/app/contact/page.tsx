export default function ContactPage() {
  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
      <h1 className="font-display text-4xl font-semibold text-maroon">
        Contact
      </h1>
      <p className="mt-3 max-w-xl text-maroon/70">
        Reach us at{" "}
        <a href="mailto:empanadasbochas@gmail.com" className="text-terracotta">
          empanadasbochas@gmail.com
        </a>{" "}
        or{" "}
        <a href="tel:+13476353853" className="text-terracotta">
          +1 (347) 635-3853
        </a>
        .
      </p>
    </section>
  );
}
