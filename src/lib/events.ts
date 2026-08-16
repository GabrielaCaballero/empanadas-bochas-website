import { parseCsv } from "./csv";

export type EventEntry = {
  date: string; // ISO yyyy-mm-dd
  venue: string;
  address: string;
  time: string;
  instagram?: string;
};

// Published-to-web CSV export of the events Google Sheet the business owner
// maintains directly — no login or API key needed, this is a public,
// read-only link. Sheet columns: Date, Venue, Start Time, End Time, Address,
// Instagram.
const EVENTS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTK5akip4yoFEptE-SmzYPyj7eTnmUDSnQadZIXXH1CvgGks7NwuJUzCriVCY9dLYMAS2Aku_zc85fC/pub?output=csv";

function toIsoDate(dateStr: string): string | null {
  // "7/4/2026" -> "2026-07-04"
  const match = dateStr.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, month, day, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function formatTime(time: string): string {
  // "1:00:00 PM" -> "1:00 PM"; leaves already-short times untouched
  const match = time.trim().match(/^(\d{1,2}):(\d{2}):\d{2}\s*(AM|PM)$/i);
  if (!match) return time.trim();
  const [, hour, minute, period] = match;
  return `${hour}:${minute} ${period.toUpperCase()}`;
}

export function todayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function getEvents(): Promise<EventEntry[]> {
  try {
    const res = await fetch(EVENTS_CSV_URL, { next: { revalidate: 300 } });
    if (!res.ok) return [];

    const text = await res.text();
    const rows = parseCsv(text);
    if (rows.length < 2) return [];

    const [header, ...dataRows] = rows;
    const colIndex = (name: string) =>
      header.findIndex((h) => h.trim().toLowerCase() === name.toLowerCase());

    const dateCol = colIndex("date");
    const venueCol = colIndex("venue");
    const startCol = colIndex("start time");
    const endCol = colIndex("end time");
    const addressCol = colIndex("address");
    const instagramCol = colIndex("instagram");

    const events: EventEntry[] = [];
    for (const row of dataRows) {
      const rawDate = row[dateCol]?.trim();
      const venue = row[venueCol]?.trim();
      if (!rawDate || !venue) continue;

      const isoDate = toIsoDate(rawDate);
      if (!isoDate) continue;

      const start = row[startCol] ? formatTime(row[startCol]) : "";
      const end = row[endCol] ? formatTime(row[endCol]) : "";
      const time = start && end ? `${start} – ${end}` : start || end || "";

      events.push({
        date: isoDate,
        venue,
        address: addressCol >= 0 ? (row[addressCol]?.trim() ?? "") : "",
        time,
        instagram:
          instagramCol >= 0 ? row[instagramCol]?.trim() || undefined : undefined,
      });
    }

    return events.sort((a, b) => a.date.localeCompare(b.date));
  } catch (err) {
    console.error("Failed to fetch events sheet", err);
    return [];
  }
}

export async function getUpcomingEvents(): Promise<EventEntry[]> {
  const today = todayIso();
  const events = await getEvents();
  return events.filter((e) => e.date >= today);
}
