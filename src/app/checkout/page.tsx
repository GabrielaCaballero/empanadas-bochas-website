import type { Metadata } from "next";
import { getUpcomingEvents } from "@/lib/events";
import { getDeliveryZones } from "@/lib/delivery-pricing";
import { getActiveSalesTax } from "@/lib/square";
import { getWeekendOptions } from "@/lib/availability";
import CheckoutClient from "@/components/CheckoutClient";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: true },
};

export default async function CheckoutPage() {
  const events = await getUpcomingEvents();
  const deliveryZones = await getDeliveryZones();
  const salesTax = await getActiveSalesTax();
  const weekendOptions = await getWeekendOptions();

  return (
    <CheckoutClient
      events={events}
      deliveryZones={deliveryZones}
      weekendOptions={weekendOptions}
      taxRate={salesTax?.rate ?? null}
      taxName={salesTax?.name ?? null}
    />
  );
}
