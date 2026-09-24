import { getUpcomingEvents } from "@/lib/events";
import { getDeliveryZones } from "@/lib/delivery-pricing";
import CheckoutClient from "@/components/CheckoutClient";

export const revalidate = 300;

export default async function CheckoutPage() {
  const events = await getUpcomingEvents();
  const deliveryZones = await getDeliveryZones();

  return <CheckoutClient events={events} deliveryZones={deliveryZones} />;
}
