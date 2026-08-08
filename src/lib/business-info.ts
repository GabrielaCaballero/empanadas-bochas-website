export const BUSINESS_WHATSAPP = "19178303570";
export const PICKUP_ADDRESS = "45-21 45th Street, Long Island City, NY 11104";
export const BUSINESS_INSTAGRAM = "https://www.instagram.com/empanadasbochas/";
export const BUSINESS_EMAIL_PUBLIC = "empanadasbochas@gmail.com";

export function whatsAppUrl(message?: string) {
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${BUSINESS_WHATSAPP}${text}`;
}
