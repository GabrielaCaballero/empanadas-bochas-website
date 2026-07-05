type EventEntry = {
  venue: string;
  address: string;
  date: string;
  time: string;
  instagram?: string;
};

// Placeholder data — replace with real upcoming stops before launch.
const events: EventEntry[] = [
  {
    venue: "Placeholder Brewery Co.",
    address: "123 Sample St, Astoria, NY 11106",
    date: "Sat, July 12",
    time: "12:00 PM – 6:00 PM",
    instagram: "https://instagram.com/",
  },
  {
    venue: "Sample Beer Garden",
    address: "456 Example Ave, Long Island City, NY 11101",
    date: "Fri, July 18",
    time: "5:00 PM – 9:00 PM",
  },
  {
    venue: "TBD Pop-Up Spot",
    address: "789 Draft Ln, Sunnyside, NY 11104",
    date: "Sun, July 27",
    time: "1:00 PM – 5:00 PM",
    instagram: "https://instagram.com/",
  },
];

export default function EventsPage() {
  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
      <h1 className="font-display text-4xl font-semibold text-maroon">
        Upcoming Events
      </h1>
      <p className="mt-3 max-w-xl text-maroon/70">
        Find us pouring at breweries and pop-ups around NYC this month.
      </p>

      <div className="mt-10 flex flex-col gap-6">
        {events.map((event) => (
          <div
            key={event.venue}
            className="flex flex-col gap-4 rounded-3xl bg-cream p-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h2 className="font-display text-xl font-semibold text-maroon">
                {event.venue}
              </h2>
              <p className="mt-1 text-maroon/70">
                {event.date} · {event.time}
              </p>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(event.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm text-terracotta hover:text-rust"
              >
                {event.address}
              </a>
              {event.instagram && (
                <a
                  href={event.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-sm text-maroon/60 hover:text-maroon"
                >
                  View on Instagram
                </a>
              )}
            </div>

            <button
              type="button"
              className="shrink-0 rounded-full border border-maroon/20 px-5 py-2 text-sm font-semibold text-maroon transition-colors hover:bg-maroon/5"
            >
              Add to Calendar
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
