import type { EventEntry } from "@/lib/events";

function parseClockTime(raw: string): { hour: number; minute: number } | null {
  const match = raw.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  const [, h, m, period] = match;
  let hour = Number(h) % 12;
  if (period.toUpperCase() === "PM") hour += 12;
  return { hour, minute: Number(m) };
}

function parseEventWindow(event: EventEntry) {
  const [year, month, day] = event.date.split("-").map(Number);
  const [rawStart, rawEnd] = event.time.split("–").map((s) => s.trim());

  const start = rawStart ? parseClockTime(rawStart) : null;
  const end = rawEnd ? parseClockTime(rawEnd) : null;

  const startHour = start?.hour ?? 12;
  const startMinute = start?.minute ?? 0;
  const endHour = end?.hour ?? startHour + 2;
  const endMinute = end?.minute ?? startMinute;

  return { year, month, day, startHour, startMinute, endHour, endMinute };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toStamp(year: number, month: number, day: number, hour: number, minute: number) {
  return `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`;
}

function eventTitle(event: EventEntry) {
  return `Empanadas Bochas at ${event.venue}`;
}

function eventDescription(event: EventEntry) {
  return `Find Empanadas Bochas at ${event.venue}.${event.instagram ? ` ${event.instagram}` : ""}`;
}

export function buildGoogleCalendarUrl(event: EventEntry): string {
  const w = parseEventWindow(event);
  const start = toStamp(w.year, w.month, w.day, w.startHour, w.startMinute);
  const end = toStamp(w.year, w.month, w.day, w.endHour, w.endMinute);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: eventTitle(event),
    dates: `${start}/${end}`,
    location: event.address,
    details: eventDescription(event),
    ctz: "America/New_York",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapeIcsText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1");
}

export function buildIcsContent(event: EventEntry): string {
  const w = parseEventWindow(event);
  const start = toStamp(w.year, w.month, w.day, w.startHour, w.startMinute);
  const end = toStamp(w.year, w.month, w.day, w.endHour, w.endMinute);

  const now = new Date();
  const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(
    now.getUTCDate(),
  )}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
  const uid = `${event.date}-${event.venue.replace(/\s+/g, "-").toLowerCase()}@empanadasbochas.com`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Empanadas Bochas//Events//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcsText(eventTitle(event))}`,
    `LOCATION:${escapeIcsText(event.address)}`,
    `DESCRIPTION:${escapeIcsText(eventDescription(event))}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

export function downloadIcs(event: EventEntry) {
  const content = buildIcsContent(event);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.venue.replace(/\s+/g, "-")}-${event.date}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
