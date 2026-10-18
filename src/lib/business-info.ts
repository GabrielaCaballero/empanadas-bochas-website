export const BUSINESS_WHATSAPP = "19178303570";
// Deliberately an area, not the kitchen's street address — that's a home
// address, so it's never published on the site, in emails, or on Square
// receipts. The exact address is sent privately on WhatsApp after an order.
export const PICKUP_AREA = "Sunnyside, Queens";
export const PICKUP_AREA_DETAIL = "near the 46 St station (7 train)";
export const PICKUP_AREA_FULL = `${PICKUP_AREA}, ${PICKUP_AREA_DETAIL}`;
export const PICKUP_ADDRESS_NOTE =
  "We\u2019ll send you the exact address on WhatsApp once you order.";
// Map search for the embedded map: the public subway station, not the kitchen.
export const PICKUP_MAP_QUERY = "46 St-Bliss St station, Queens, NY";
export const BUSINESS_INSTAGRAM = "https://www.instagram.com/empanadasbochas/";
export const BUSINESS_EMAIL_PUBLIC = "empanadasbochas@gmail.com";

export function whatsAppUrl(message?: string) {
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${BUSINESS_WHATSAPP}${text}`;
}
