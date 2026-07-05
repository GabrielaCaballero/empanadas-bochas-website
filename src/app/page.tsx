import Image from "next/image";
import Link from "next/link";

const photos = [
  {
    src: "/photos/empanada-2.png",
    alt: "Box of Empanadas Bochas empanadas",
    span: "sm:col-span-2 sm:row-span-2",
  },
  {
    src: "/photos/empanada-3.png",
    alt: "Empanadas served with dipping sauce",
    span: "",
  },
  {
    src: "/photos/empanada-1.png",
    alt: "Hands holding a fresh empanada",
    span: "",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-6 px-6 pt-8 pb-10 text-center">
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
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
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
            Find Us This Month
          </Link>
        </div>
      </section>

      <section className="grid w-full grid-cols-1 gap-1 pb-16 sm:grid-cols-3 sm:grid-rows-2 sm:h-[600px]">
        {photos.map((photo) => (
          <div
            key={photo.src}
            className={`group relative aspect-square overflow-hidden sm:aspect-auto ${photo.span}`}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(min-width: 640px) 66vw, 100vw"
            />
          </div>
        ))}
      </section>
    </div>
  );
}
