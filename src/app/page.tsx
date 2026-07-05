import Image from "next/image";
import Link from "next/link";
import { flavorInfo } from "@/lib/flavor-info";
import VideoHero from "@/components/VideoHero";
import Testimonials from "@/components/Testimonials";

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
        <div className="absolute inset-0 bg-gradient-to-b from-maroon/45 via-maroon/70 to-maroon/45" />

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

      <VideoHero />

      <section className="overflow-hidden bg-cream px-6 py-24 sm:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-20">
          <div className="grid items-center gap-10 sm:grid-cols-2">
            <div className="relative mx-auto aspect-4/5 w-full max-w-sm -rotate-2 overflow-hidden rounded-3xl shadow-xl sm:mx-0">
              <Image
                src="/photos/empanada-4.png"
                alt="Trays of freshly baked empanadas"
                fill
                className="object-cover"
                sizes="(min-width: 640px) 400px, 100vw"
              />
            </div>
            <div>
              <h2 className="font-display text-4xl font-bold text-maroon sm:text-5xl">
                Made by Hand, Batch by Batch
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-maroon/75">
                Empanadas Bochas was born from the flavors we grew up with —
                the kind of food that brings families together around the
                table. Every empanada is folded and baked by hand, just like
                in family kitchens back home.
              </p>
            </div>
          </div>

          <div className="grid items-center gap-10 sm:grid-cols-2">
            <div className="order-2 sm:order-1">
              <h2 className="font-display text-3xl font-bold text-terracotta sm:text-4xl">
                From Buenos Aires to NYC
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-maroon/75">
                Each recipe is rooted in tradition, slow-cooked with care to
                capture the warmth and nostalgia of a shared meal. Now in New
                York, we&rsquo;re proud to bring those familiar Argentine
                flavors to new tables, one empanada at a time.
              </p>
            </div>
            <div className="relative order-1 mx-auto aspect-4/5 w-full max-w-sm rotate-2 overflow-hidden rounded-3xl shadow-xl sm:order-2 sm:mx-0">
              <Image
                src="/photos/empanada-5.png"
                alt="Cross-section of four empanada flavors"
                fill
                className="object-cover"
                sizes="(min-width: 640px) 400px, 100vw"
              />
            </div>
          </div>
        </div>
      </section>

      <Testimonials />

      <section className="mx-auto w-full max-w-6xl px-6 pt-8 pb-24">
        <div className="text-center">
          <h2 className="font-display text-3xl font-semibold text-maroon sm:text-4xl">
            Our Flavors
          </h2>
          <p className="mt-3 text-maroon/70">
            A few of the favorites you&rsquo;ll find in every batch.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2">
          {flavorInfo.map((flavor) => (
            <div key={flavor.name} className="flex gap-5">
              <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-2xl bg-cream sm:w-36">
                {flavor.image && (
                  <Image
                    src={flavor.image}
                    alt={flavor.name}
                    fill
                    className="object-cover"
                    sizes="(min-width: 640px) 144px, 112px"
                  />
                )}
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-maroon">
                  {flavor.name}
                </h3>
                <p className="mt-2 text-maroon/70">{flavor.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
