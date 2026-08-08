"use client";

import { useState } from "react";
import type { EventEntry } from "@/lib/events";

export default function EventsCalendar({ events }: { events: EventEntry[] }) {
  const [selected, setSelected] = useState<EventEntry | null>(events[0] ?? null);

  if (events.length === 0) {
    return (
      <p className="mt-10 text-maroon/60">
        No upcoming stops posted right now — check back soon!
      </p>
    );
  }

  const referenceDate = new Date(`${events[0].date}T00:00:00`);
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  function eventForDay(day: number) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.find((e) => e.date === iso);
  }

  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstOfMonth.getDay();
  const monthLabel = firstOfMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="rounded-3xl bg-cream p-6">
        <h2 className="text-center font-display text-lg font-semibold text-maroon">
          {monthLabel}
        </h2>
        <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-medium text-maroon/50">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-2">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />;
            const event = eventForDay(day);
            const isSelected = Boolean(
              selected && event && selected.date === event.date,
            );
            return (
              <button
                key={i}
                type="button"
                disabled={!event}
                onClick={() => event && setSelected(event)}
                className={`aspect-square rounded-xl text-sm font-medium transition-colors ${
                  event
                    ? isSelected
                      ? "bg-maroon text-cream"
                      : "bg-terracotta text-background hover:bg-rust"
                    : "text-maroon/30"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl bg-cream p-6">
        {selected ? (
          <>
            <h2 className="font-display text-xl font-semibold text-maroon">
              {selected.venue}
            </h2>
            <p className="mt-1 text-maroon/70">
              {new Date(`${selected.date}T00:00:00`).toLocaleDateString(
                "en-US",
                { weekday: "long", month: "long", day: "numeric" },
              )}{" "}
              · {selected.time}
            </p>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(selected.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-terracotta hover:text-rust"
            >
              {selected.address}
            </a>
            {selected.instagram && (
              <a
                href={selected.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block text-sm text-maroon/60 hover:text-maroon"
              >
                View on Instagram
              </a>
            )}
            <button
              type="button"
              className="mt-6 w-full rounded-full border border-maroon/20 px-5 py-2 text-sm font-semibold text-maroon transition-colors hover:bg-maroon/5"
            >
              Add to Calendar
            </button>
          </>
        ) : (
          <p className="text-maroon/60">
            Select a highlighted date to see details.
          </p>
        )}
      </div>
    </div>
  );
}
