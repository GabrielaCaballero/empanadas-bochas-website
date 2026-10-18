import type { Metadata } from "next";
import ProductSection from "@/components/ProductSection";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Alfajores",
  description:
    "Argentine alfajores from Empanadas Bochas — order online in NYC for pickup or delivery.",
  alternates: { canonical: "/alfajores" },
};

export default function AlfajoresPage() {
  return (
    <ProductSection
      section="alfajores"
      title="Alfajores"
      blurb="Soft, filled Argentine sandwich cookies. Order online for pickup or delivery."
    />
  );
}
