import { getEvents } from "@/lib/events";
import EventsCalendar from "@/components/EventsCalendar";

export const revalidate = 300;

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
      <h1 className="font-display text-4xl font-semibold text-maroon">
        Upcoming Events
      </h1>
      <p className="mt-3 max-w-xl text-maroon/70">
        Find us pouring at breweries and pop-ups around NYC. Tap a
        highlighted date to see details.
      </p>

      <EventsCalendar events={events} />
    </section>
  );
}
