import Image from "next/image";
import Link from "next/link";

const photos = [
  {
    src: "/photos/empanada-3.png",
    alt: "Empanadas served with dipping sauce",
  },
  {
    src: "/photos/empanada-1.png",
    alt: "Hands holding a fresh empanada",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="relative flex h-[85vh] min-h-[560px] w-full items-center justify-center overflow-hidden">
        <Image
          src="/photos/empanada-2.png"
          alt="Box of Empanadas Bochas empanadas"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-maroon/55" />

        <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center text-cream">
          <span className="rounded-full bg-cream/15 px-4 py-1 text-sm font-medium ring-1 ring-cream/40 backdrop-blur-sm">
            Homemade · Argentina to NYC
          </span>
          <h1 className="max-w-2xl font-display text-4xl font-semibold sm:text-6xl">
            Empanadas made the way abuela taught us
          </h1>
          <p className="max-w-xl text-lg text-cream/85">
            Find us pouring beers and slinging empanadas at breweries around
            NYC, or order ahead for pickup and delivery.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/shop"
              className="rounded-full bg-terracotta px-6 py-3 font-semibold text-background transition-colors hover:bg-rust"
            >
              Shop the Menu
            </Link>
            <Link
              href="/events"
              className="rounded-full border border-cream/50 px-6 py-3 font-semibold text-cream transition-colors hover:bg-cream/10"
            >
              Find Us This Month
            </Link>
          </div>
        </div>
      </section>

      <section className="grid w-full grid-cols-1 gap-1 sm:grid-cols-2">
        {photos.map((photo) => (
          <div
            key={photo.src}
            className="group relative aspect-[4/3] overflow-hidden"
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(min-width: 640px) 50vw, 100vw"
            />
          </div>
        ))}
      </section>
    </div>
  );
}
