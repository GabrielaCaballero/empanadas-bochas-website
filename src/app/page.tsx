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

const flavors = [
  {
    name: "Beef Malbec",
    image: "/menu/beef-malbec.webp",
    description:
      "Slow-cooked beef, tender and flavorful, marinated in Argentine Malbec wine. Rich, juicy, and deeply savory.",
  },
  {
    name: "Chicken Scallion",
    image: "/menu/chicken-scallion.webp",
    description:
      "Creamy chicken filling with fresh scallions, perfectly balanced and comforting, with a smooth and savory finish.",
  },
  {
    name: "Fugazzeta",
    image: "/menu/fugazzeta.webp",
    description:
      "Sweet caramelized onions and melted mozzarella cheese, inspired by the classic Argentine pizza. Bold, cheesy, and irresistible.",
  },
  {
    name: "Ham & Cheese",
    image: "/menu/ham-cheese.webp",
    description:
      "Classic ham and melted cheese wrapped in a golden baked crust. Simple, comforting, and always a favorite.",
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

      <section className="bg-maroon px-6 py-24 text-cream">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            Meet Empanadas Bochas
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-cream/85">
            Empanadas Bochas was born from the flavors we grew up with. The
            kind of food that brings families together around the table.
            Inspired by traditional Argentine home cooking, our empanadas are
            made by hand, just like in family kitchens back home.
          </p>
          <p className="mt-6 text-lg leading-relaxed text-cream/85">
            Each recipe is rooted in tradition, slow-cooked with care and
            baked fresh to capture the warmth, comfort, and nostalgia of a
            shared meal. For us, empanadas are more than food — they&rsquo;re
            a way of sharing memories, stories, and a taste of home.
          </p>
          <p className="mt-6 text-lg leading-relaxed text-cream/85">
            Now in New York, we&rsquo;re proud to bring those familiar
            Argentine flavors to new tables, one empanada at a time.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-24">
        <div className="text-center">
          <h2 className="font-display text-3xl font-semibold text-maroon sm:text-4xl">
            Our Flavors
          </h2>
          <p className="mt-3 text-maroon/70">
            A few of the favorites you&rsquo;ll find in every batch.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2">
          {flavors.map((flavor) => (
            <div key={flavor.name} className="flex gap-5">
              <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-2xl bg-cream sm:w-36">
                <Image
                  src={flavor.image}
                  alt={flavor.name}
                  fill
                  className="object-cover"
                  sizes="(min-width: 640px) 144px, 112px"
                />
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
