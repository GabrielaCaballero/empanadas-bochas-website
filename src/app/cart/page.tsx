import { getCatalogItems } from "@/lib/square";
import CartClient from "@/components/CartClient";

export const revalidate = 300;

export default async function CartPage() {
  const items = await getCatalogItems();
  const sauceItem = items.find((i) => i.name.trim().toLowerCase() === "sauce");
  const sauceVariations = (sauceItem?.variations ?? [])
    .filter((v) => v.priceCents != null)
    .map((v) => ({ id: v.id, name: v.name, priceCents: v.priceCents as number }));

  return <CartClient sauceVariations={sauceVariations} />;
}
