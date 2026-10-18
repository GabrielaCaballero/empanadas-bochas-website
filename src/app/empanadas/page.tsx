import type { Metadata } from "next";
import ProductSection from "@/components/ProductSection";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Empanadas",
  description:
    "Order homemade Argentine empanadas online in NYC — boxes of 3, 6, or 12, single empanadas, and sauces. Pickup or delivery.",
  alternates: { canonical: "/empanadas" },
};

export default function EmpanadasPage() {
  return (
    <ProductSection
      section="empanadas"
      title="Empanadas"
      blurb="Handmade and baked fresh. Order online for pickup or delivery."
    />
  );
}
