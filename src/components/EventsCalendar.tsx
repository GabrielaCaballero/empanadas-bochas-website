"use client";

import { useState } from "react";
import Image from "next/image";
import type { EventEntry } from "@/lib/events";
import { todayIso } from "@/lib/events";
import { MONTH_THEMES } from "@/lib/month-themes";
import NycSkyline from "@/components/NycSkyline";
import { buildGoogleCalendarUrl, downloadIcs } from "@/lib/calendar-links";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function boroughOf(address: string) {
  const parts = address.split(",");
  return parts.length > 1 ? parts[parts.length - 1].trim() : address.trim();
}

function CalendarPlusIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path d="M6 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm10 7H4v7h12V9Zm-6 2a1 1 0 0 1 1 1v1h1a1 1 0 1 1 0 2h-1v1a1 1 0 1 1-2 0v-1H8a1 1 0 1 1 0-2h1v-1a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function formatFull(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function EventsCalendar({ events }: { events: EventEntry[] }) {
  const today = todayIso();
  const now = new Date();

  const upcoming = events.filter((e) => e.date >= today);
  const [selected, setSelected] = useState<EventEntry | null>(
    upcoming[0] ?? events[0] ?? null,
  );
  const [viewYear, setViewYear] = useState(
    selected ? Number(selected.date.slice(0, 4)) : now.getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState(
    selected ? Number(selected.date.slice(5, 7)) - 1 : now.getMonth(),
  );

  const boroughs = Array.from(new Set(events.map((e) => boroughOf(e.address)))).sort();
  const [locationFilter, setLocationFilter] = useState<string>("All");

  function matchesFilters(event: EventEntry) {
    return locationFilter === "All" || boroughOf(event.address) === locationFilter;
  }

  function eventForDay(day: number) {
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.find((e) => e.date === iso);
  }

  function goToMonth(deltaMonths: number) {
    const next = new Date(viewYear, viewMonth + deltaMonths, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startWeekday = firstOfMonth.getDay();
  const theme = MONTH_THEMES[viewMonth];

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="mt-10">
      {/* Themed month banner — fades into the page below instead of ending in a hard edge */}
      <div
        className="relative overflow-hidden rounded-t-3xl px-6 pt-8 pb-16 sm:px-10 sm:pt-10 sm:pb-20"
        style={{
          background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
        }}
      >
        {/* Warm bokeh glow, evoking string lights over a night market */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-6 right-24 h-16 w-16 rounded-full bg-cream/20 blur-2xl" />
          <div className="absolute top-16 right-52 h-10 w-10 rounded-full bg-terracotta/30 blur-xl" />
          <div className="absolute top-4 right-72 h-8 w-8 rounded-full bg-cream/10 blur-lg" />
          <div className="absolute bottom-20 right-10 h-20 w-20 rounded-full bg-cream/10 blur-2xl" />
        </div>

        <NycSkyline className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full text-background/10 sm:h-24" />

        {/* Soft dissolve into the page background so the banner reads as one
            continuous surface with the calendar below, not a separate card */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-background sm:h-24" />

        <div className="pointer-events-none absolute right-6 bottom-8 h-20 w-20 rotate-6 overflow-hidden rounded-full shadow-2xl ring-4 ring-cream/30 sm:right-10 sm:bottom-10 sm:h-28 sm:w-28">
          <Image
            src="/photos/empanada-5.png"
            alt=""
            fill
            className="object-cover"
            sizes="112px"
          />
        </div>

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <span className="text-4xl sm:text-5xl">{theme.emoji}</span>
            <h2 className="mt-3 font-display text-2xl font-semibold text-cream sm:text-3xl">
              {theme.label} {viewYear}
            </h2>
            <p className="mt-1 max-w-sm text-sm text-cream/80 sm:text-base">
              {theme.blurb}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => goToMonth(-1)}
              aria-label="Previous month"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/15 text-cream ring-1 ring-cream/30 backdrop-blur-sm transition-colors hover:bg-cream/25"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => goToMonth(1)}
              aria-label="Next month"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/15 text-cream ring-1 ring-cream/30 backdrop-blur-sm transition-colors hover:bg-cream/25"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Filters — pulled up into the banner's fade so it reads as one flow */}
      <div className="relative z-10 -mt-8 flex flex-wrap items-center gap-2 px-6 sm:-mt-10 sm:px-10">
        <span className="text-xs font-semibold tracking-wide text-maroon/50 uppercase">
          Location
        </span>
        {["All", ...boroughs].map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => setLocationFilter(loc)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              locationFilter === loc
                ? "border-terracotta bg-terracotta text-background"
                : "border-maroon/20 text-maroon hover:bg-maroon/5"
            }`}
          >
            {loc}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-3xl bg-cream p-6 shadow-sm">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-maroon/50">
            {WEEKDAYS.map((d, i) => (
              <div key={i}>{d}</div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {cells.map((day, i) => {
              if (day === null) return <div key={i} />;
              const rawEvent = eventForDay(day);
              const event = rawEvent && matchesFilters(rawEvent) ? rawEvent : undefined;
              const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isToday = iso === today;
              const isPast = iso < today;
              const isSelected = Boolean(
                selected && event && selected.date === event.date,
              );

              let cellClasses =
                "aspect-square rounded-xl text-sm font-medium transition-all";
              if (event) {
                if (isSelected) {
                  cellClasses += " bg-maroon text-cream shadow-md scale-105";
                } else if (isPast) {
                  cellClasses +=
                    " border border-maroon/25 text-maroon/60 hover:bg-maroon/5";
                } else {
                  cellClasses +=
                    " bg-terracotta text-background hover:bg-rust hover:scale-105";
                }
              } else {
                cellClasses += isPast
                  ? " text-maroon/25"
                  : " text-maroon/40";
              }
              if (isToday) {
                cellClasses += " ring-2 ring-terracotta ring-offset-2 ring-offset-cream";
              }

              return (
                <button
                  key={i}
                  type="button"
                  disabled={!event}
                  onClick={() => event && setSelected(event)}
                  className={cellClasses}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-maroon/60">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-terracotta" />
              Upcoming stop
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-maroon/40" />
              Past stop
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full ring-2 ring-terracotta" />
              Today
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-cream shadow-sm">
          <div
            className="h-1.5 w-full"
            style={{
              background: `linear-gradient(90deg, ${theme.from}, ${theme.to})`,
            }}
          />
          <div className="p-6">
            {selected ? (
              <>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    selected.date < today
                      ? "bg-maroon/10 text-maroon/60"
                      : "bg-terracotta/15 text-rust"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      selected.date < today ? "bg-maroon/40" : "bg-terracotta"
                    }`}
                  />
                  {selected.date < today ? "Past stop" : "Upcoming stop"}
                </span>

                <h2 className="mt-3 font-display text-2xl font-semibold text-maroon">
                  {selected.venue}
                </h2>

                <div className="mt-5 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-maroon/5 text-maroon">
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path d="M6 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm10 7H4v7h12V9Z" />
                      </svg>
                    </span>
                    <p className="pt-1.5 text-sm text-maroon/80">
                      {formatFull(selected.date)}
                      <br />
                      {selected.time}
                    </p>
                  </div>

                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(selected.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta transition-colors group-hover:bg-terracotta/20 group-hover:text-rust">
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18s6-5.686 6-10a6 6 0 1 0-12 0c0 4.314 6 10 6 10Zm0-7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <span className="pt-1.5 text-sm text-terracotta underline decoration-terracotta/40 underline-offset-2 group-hover:text-rust group-hover:decoration-rust/50">
                      {selected.address}
                    </span>
                  </a>

                  {selected.instagram && (
                    <a
                      href={selected.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta transition-colors group-hover:bg-terracotta/20 group-hover:text-rust">
                        <svg
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 2c-2.17 0-2.444.01-3.297.048-.852.04-1.433.174-1.942.372a3.92 3.92 0 0 0-1.417.923 3.92 3.92 0 0 0-.923 1.417c-.198.51-.333 1.09-.372 1.942C2.01 7.556 2 7.83 2 10s.01 2.444.048 3.297c.04.852.174 1.433.372 1.942.204.526.478.972.923 1.417.445.445.891.719 1.417.923.51.198 1.09.333 1.942.372C7.556 17.99 7.83 18 10 18s2.444-.01 3.297-.048c.852-.04 1.433-.174 1.942-.372a3.92 3.92 0 0 0 1.417-.923c.445-.445.719-.891.923-1.417.198-.51.333-1.09.372-1.942C17.99 12.444 18 12.17 18 10s-.01-2.444-.048-3.297c-.04-.852-.174-1.433-.372-1.942a3.92 3.92 0 0 0-.923-1.417 3.92 3.92 0 0 0-1.417-.923c-.51-.198-1.09-.333-1.942-.372C12.444 2.01 12.17 2 10 2Zm0 1.8c2.134 0 2.388.008 3.23.046.78.036 1.204.166 1.486.276.373.145.64.318.92.598.28.28.453.547.598.92.11.282.24.706.276 1.486.038.842.046 1.096.046 3.23s-.008 2.388-.046 3.23c-.036.78-.166 1.204-.276 1.486a2.47 2.47 0 0 1-.598.92c-.28.28-.547.453-.92.598-.282.11-.706.24-1.486.276-.842.038-1.096.046-3.23.046s-2.388-.008-3.23-.046c-.78-.036-1.204-.166-1.486-.276a2.47 2.47 0 0 1-.92-.598 2.47 2.47 0 0 1-.598-.92c-.11-.282-.24-.706-.276-1.486C3.808 12.388 3.8 12.134 3.8 10s.008-2.388.046-3.23c.036-.78.166-1.204.276-1.486.145-.373.318-.64.598-.92.28-.28.547-.453.92-.598.282-.11.706-.24 1.486-.276.842-.038 1.096-.046 3.23-.046Zm0 3.067A3.133 3.133 0 1 0 10 13.133 3.133 3.133 0 0 0 10 6.867Zm0 5.166A2.033 2.033 0 1 1 10 7.967a2.033 2.033 0 0 1 0 4.066Zm3.988-5.293a.733.733 0 1 1 0-1.466.733.733 0 0 1 0 1.466Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                      <span className="text-sm text-terracotta underline decoration-terracotta/40 underline-offset-2 group-hover:text-rust group-hover:decoration-rust/50">
                        View on Instagram
                      </span>
                    </a>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <a
                    href={buildGoogleCalendarUrl(selected)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-full bg-terracotta px-4 py-3 text-sm font-semibold text-background transition-colors hover:bg-rust"
                  >
                    <CalendarPlusIcon />
                    Google
                  </a>
                  <button
                    type="button"
                    onClick={() => downloadIcs(selected)}
                    className="flex items-center justify-center gap-2 rounded-full border border-maroon/20 px-4 py-3 text-sm font-semibold text-maroon transition-colors hover:bg-maroon/5"
                  >
                    <CalendarPlusIcon />
                    Apple/Outlook
                  </button>
                </div>
              </>
            ) : (
              <p className="text-maroon/60">
                {events.length === 0
                  ? "No stops posted yet — check back soon!"
                  : "Select a highlighted date to see details."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
