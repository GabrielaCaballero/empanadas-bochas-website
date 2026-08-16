import { getCatalogItems } from "@/lib/square";
import { getUpcomingEvents } from "@/lib/events";
import { getDeliveryZones } from "@/lib/delivery-pricing";
import CheckoutClient from "@/components/CheckoutClient";

export const revalidate = 300;

export default async function CheckoutPage() {
  const items = await getCatalogItems();
  const sauceItem = items.find((i) => i.name.trim().toLowerCase() === "sauce");
  const saucePriceCents = sauceItem?.variations.find(
    (v) => v.priceCents != null,
  )?.priceCents ?? 0;
  const events = await getUpcomingEvents();
  const deliveryZones = await getDeliveryZones();

  return (
    <CheckoutClient
      saucePriceCents={saucePriceCents}
      events={events}
      deliveryZones={deliveryZones}
    />
  );
}
