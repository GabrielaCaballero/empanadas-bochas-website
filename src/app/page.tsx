import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-6 px-6 py-24 text-center">
        <span className="rounded-full bg-cream px-4 py-1 text-sm font-medium text-rust">
          Homemade · Argentina to NYC
        </span>
        <h1 className="max-w-2xl font-display text-4xl font-semibold text-maroon sm:text-6xl">
          Empanadas made the way abuela taught us
        </h1>
        <p className="max-w-xl text-lg text-maroon/80">
          Find us pouring beers and slinging empanadas at breweries around
          NYC, or order ahead for pickup and delivery.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/shop"
            className="rounded-full bg-terracotta px-6 py-3 font-semibold text-background transition-colors hover:bg-rust"
          >
            Shop the Menu
          </Link>
          <Link
            href="/events"
            className="rounded-full border border-maroon/20 px-6 py-3 font-semibold text-maroon transition-colors hover:bg-maroon/5"
          >
            Find Us This Week
          </Link>
        </div>
      </section>
    </div>
  );
}
