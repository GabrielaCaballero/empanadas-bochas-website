import { getCatalogItems } from "@/lib/square";
import CheckoutClient from "@/components/CheckoutClient";

export const revalidate = 300;

export default async function CheckoutPage() {
  const items = await getCatalogItems();
  const sauceItem = items.find((i) => i.name.trim().toLowerCase() === "sauce");
  const saucePriceCents = sauceItem?.variations.find(
    (v) => v.priceCents != null,
  )?.priceCents ?? 0;

  return <CheckoutClient saucePriceCents={saucePriceCents} />;
}
