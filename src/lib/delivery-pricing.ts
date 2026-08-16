import { parseCsv } from "./csv";

export type DeliveryZone = {
  id: string; // slug of neighborhood, e.g. "astoria" — stable <select> value
  borough: string;
  postalCodes: string[];
  neighborhood: string;
  priceCents: number; // 0 for "FREE" rows
};

export const FREE_DELIVERY_THRESHOLD_CENTS = 12000; // $120

// Same spreadsheet as EVENTS_CSV_URL in events.ts, a different published tab
// (gid). Sheet columns: Borough, Postal Code, Neighborhood, Delivery Price.
// Borough is only filled on each zone's first row, so it needs forward-fill.
// Price is a bare dollar number or the literal "FREE". The sheet also has a
// trailing free-text note row ("A partir de $120 el envío es FREE.") which
// isn't real data — it gets skipped naturally because it fails to parse as
// either a number or "FREE", not via a hardcoded row index.
const DELIVERY_PRICING_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTK5akip4yoFEptE-SmzYPyj7eTnmUDSnQadZIXXH1CvgGks7NwuJUzCriVCY9dLYMAS2Aku_zc85fC/pub?output=csv&gid=220317150";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Sheet formatting varies (bare "5", currency-formatted "$5.00", possibly
// "$1,200.00" for larger numbers) — this only accepts strings that are
// ENTIRELY a number (with optional $ and thousands commas), not just
// strings that happen to contain digits somewhere. That distinction matters
// because the sheet's trailing free-text note row ("A partir de $120 el
// envío es FREE.") also contains a dollar amount — it must fail to parse
// here (so it gets skipped as non-data) rather than be read as a price.
const PRICE_PATTERN = /^\$?-?[\d,]+(\.\d+)?$/;

function parsePriceCents(raw: string): number | null {
  const trimmed = raw.trim();
  if (/^free$/i.test(trimmed)) return 0;
  if (!PRICE_PATTERN.test(trimmed)) return null;
  const n = Number(trimmed.replace(/[$,]/g, ""));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  try {
    const res = await fetch(DELIVERY_PRICING_CSV_URL, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];

    const text = await res.text();
    const rows = parseCsv(text);
    if (rows.length < 2) return [];

    const [header, ...dataRows] = rows;
    const colIndex = (name: string) =>
      header.findIndex((h) => h.trim().toLowerCase() === name.toLowerCase());

    const boroughCol = colIndex("borough");
    const postalCol = colIndex("postal code");
    const neighborhoodCol = colIndex("neighborhood");
    const priceCol = colIndex("delivery price");

    const zones: DeliveryZone[] = [];
    let currentBorough = "";

    for (const row of dataRows) {
      const boroughCell = row[boroughCol]?.trim();
      if (boroughCell) currentBorough = boroughCell;

      const neighborhood = row[neighborhoodCol]?.trim();
      const postalCodes = (row[postalCol] ?? "")
        .split("/")
        .map((code) => code.trim())
        .filter(Boolean);
      const priceCents = row[priceCol] ? parsePriceCents(row[priceCol]) : null;

      if (!neighborhood || postalCodes.length === 0 || priceCents === null) {
        continue;
      }

      zones.push({
        id: slugify(neighborhood),
        borough: currentBorough,
        postalCodes,
        neighborhood,
        priceCents,
      });
    }

    return zones;
  } catch (err) {
    console.error("Failed to fetch delivery pricing sheet", err);
    return [];
  }
}

// Pure/sync — called from both the checkout picker (to label each zone row)
// and the checkout API route (to actually charge), so the $120 free-delivery
// rule only ever lives in one place.
export function computeDeliveryFeeCents(
  zone: DeliveryZone,
  cartSubtotalCents: number,
): number {
  return cartSubtotalCents >= FREE_DELIVERY_THRESHOLD_CENTS ? 0 : zone.priceCents;
}
