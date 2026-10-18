import type { CatalogItem } from "./square";

export type Section = "empanadas" | "alfajores";

// Square's catalog has no categories set up, so items are sorted into the
// site's sections by name: anything with "alfajor" in it goes to Alfajores,
// everything else (boxes, single empanadas, and the sauce add-on) goes to
// Empanadas. If categories are ever created in Square, this is the one place
// to switch over to reading them.
export function sectionOf(item: CatalogItem): Section {
  return /alfajor/i.test(item.name) ? "alfajores" : "empanadas";
}
