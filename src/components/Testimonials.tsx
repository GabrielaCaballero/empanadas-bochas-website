"use client";

import { useState } from "react";

type Testimonial = {
  quote: string;
  name: string;
};

const testimonials: Testimonial[] = [
  {
    quote:
      "Delicious, fast, and so convenient — I'm not much of a cook, so I keep a few boxes in my freezer and pull one out whenever I'm hungry for something great.",
    name: "Gabriela Caballero",
  },
  {
    quote:
      "Hands down the best empanadas I've had in NYC. The dough alone is worth it.",
    name: "Angela Davila",
  },
  {
    quote:
      "I order the beef malbec every single time and it never disappoints. So comforting.",
    name: "Juliana Montesino",
  },
  {
    quote:
      "One bite and I was back in Buenos Aires. It's exactly the taste I grew up with.",
    name: "Joan La Madrid",
  },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const current = testimonials[index];

  function prev() {
    setIndex((i) => (i - 1 + testimonials.length) % testimonials.length);
  }

  function next() {
    setIndex((i) => (i + 1) % testimonials.length);
  }

  return (
    <section className="px-6 pt-24 pb-8">
      <div className="mx-auto max-w-3xl rounded-3xl bg-cream px-8 py-16 text-center">
        <p className="font-display text-2xl font-semibold text-maroon sm:text-3xl">
          &ldquo;{current.quote}&rdquo;
        </p>
        <p className="mt-6 text-sm font-medium tracking-wide text-maroon/60 uppercase">
          {current.name}
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous testimonial"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-maroon text-cream transition-colors hover:bg-rust"
          >
            ←
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next testimonial"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-maroon text-cream transition-colors hover:bg-rust"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
