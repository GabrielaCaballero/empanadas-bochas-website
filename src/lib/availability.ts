import { parseCsv } from "./csv";
import { getEvents } from "./events";
import { getBookableWeekendDates } from "./weekend-dates";

// The "availability" tab (Sheet3) of the same published Google Sheet that
// holds events and delivery pricing. One row per weekend day, columns:
//   Date | Delivery | Kitchen Pickup | Pickup Hours | Delivery Hours
// "No" in Delivery / Kitchen Pickup closes that option for that day; blank
// or "Yes" leaves it open. Hours are free text shown to the customer
// (e.g. "11am – 3pm"). A weekend day missing from the sheet — or the whole
// tab being empty/unreachable — just means "open", so a sheet problem can
// never silently shut the shop. See docs/availability-sheet.md.
const AVAILABILITY_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTK5akip4yoFEptE-SmzYPyj7eTnmUDSnQadZIXXH1CvgGks7NwuJUzCriVCY9dLYMAS2Aku_zc85fC/pub?output=csv&gid=847530003";

export type ChannelOption = {
  available: boolean;
  // Why it's closed, shown on the greyed-out day card.
  reason?: string;
  // Time window for that day, if the sheet gives one.
  hours?: string;
};

export type DayOption = {
  date: string; // ISO yyyy-mm-dd, always a Saturday or Sunday
  delivery: ChannelOption;
  kitchen: ChannelOption;
};

type SheetRow = {
  delivery: boolean;
  kitchen: boolean;
  pickupHours?: string;
  deliveryHours?: string;
};

function toIsoDate(dateStr: string): string | null {
  const match = dateStr.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, month, day, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

// Anything that reads as a "no" closes the option; empty and everything
// else counts as open.
function isOpen(cell: string | undefined): boolean {
  const v = (cell ?? "").trim().toLowerCase();
  return !["no", "n", "false", "0", "closed", "not available", "unavailable"].includes(v);
}

async function getSheetRows(): Promise<Map<string, SheetRow>> {
  const result = new Map<string, SheetRow>();
  try {
    const res = await fetch(AVAILABILITY_CSV_URL, { next: { revalidate: 300 } });
    if (!res.ok) return result;

    const rows = parseCsv(await res.text());
    if (rows.length < 2) return result;

    const [header, ...dataRows] = rows;
    const col = (name: string) =>
      header.findIndex((h) => h.trim().toLowerCase() === name);
    const dateCol = col("date");
    const deliveryCol = col("delivery");
    const kitchenCol = col("kitchen pickup");
    const pickupHoursCol = col("pickup hours");
    const deliveryHoursCol = col("delivery hours");
    if (dateCol < 0) return result;

    for (const row of dataRows) {
      const iso = toIsoDate(row[dateCol] ?? "");
      if (!iso) continue;
      result.set(iso, {
        delivery: deliveryCol >= 0 ? isOpen(row[deliveryCol]) : true,
        kitchen: kitchenCol >= 0 ? isOpen(row[kitchenCol]) : true,
        pickupHours: row[pickupHoursCol]?.trim() || undefined,
        deliveryHours: row[deliveryHoursCol]?.trim() || undefined,
      });
    }
  } catch (err) {
    console.error("Failed to fetch availability sheet", err);
  }
  return result;
}

// The weekend days a customer can currently choose from, with what's open
// on each. Used by the checkout page to build the day picker AND by the
// checkout API to re-validate the chosen day, so the rules only live here:
//   - delivery: any weekend day the sheet hasn't closed (pop-ups don't matter)
//   - kitchen pickup: any weekend day the sheet hasn't closed AND with no
//     pop-up event that day (on pop-up days, customers pick up at the event)
export async function getWeekendOptions(): Promise<DayOption[]> {
  const [sheet, events] = await Promise.all([getSheetRows(), getEvents()]);
  const eventByDate = new Map(events.map((e) => [e.date, e]));

  return getBookableWeekendDates().map((date) => {
    const row = sheet.get(date);
    const event = eventByDate.get(date);

    const delivery: ChannelOption = {
      available: row?.delivery ?? true,
      hours: row?.deliveryHours,
    };
    if (!delivery.available) delivery.reason = "Not available";

    const kitchen: ChannelOption = {
      available: (row?.kitchen ?? true) && !event,
      hours: row?.pickupHours,
    };
    if (event) kitchen.reason = `Pop-up at ${event.venue} — pick up there`;
    else if (!kitchen.available) kitchen.reason = "Not available";

    return { date, delivery, kitchen };
  });
}
