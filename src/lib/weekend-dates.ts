// Kitchen pickup and delivery are only available on weekends (event pickup
// is available at every pop-up and isn't affected). Dates are plain
// "YYYY-MM-DD" strings throughout, and the weekday is derived from the
// string itself via UTC, so none of this shifts with the viewer's or the
// server's timezone — only "today" is anchored to New York time.

// Earliest bookable day, counted from today. 1 means tomorrow — nothing
// same-day, since everything is made to order. Raise if more lead time is
// needed.
const MIN_LEAD_DAYS = 1;
// How many days ahead customers can book.
const WINDOW_DAYS = 28;

function todayNewYork(): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
  }).format(new Date());
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function weekday(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function isWeekend(iso: string): boolean {
  const day = weekday(iso);
  return day === 0 || day === 6;
}

export function getBookableWeekendDates(): string[] {
  const today = todayNewYork();
  const dates: string[] = [];
  for (let i = MIN_LEAD_DAYS; i <= WINDOW_DAYS; i++) {
    const iso = addDays(today, i);
    if (isWeekend(iso)) dates.push(iso);
  }
  return dates;
}

// "Saturday, October 10 · 11am – 3pm" — the day, plus the window if the
// availability sheet gave one for it.
export function formatDayWithHours(iso: string, hours?: string): string {
  const day = formatWeekendDate(iso, true);
  return hours ? `${day} · ${hours}` : day;
}

export function formatWeekendDate(iso: string, long = false): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: long ? "long" : "short",
    month: long ? "long" : "short",
    day: "numeric",
  });
}
