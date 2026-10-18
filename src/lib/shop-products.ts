import { getCatalogItems, type CatalogItem } from "./square";
import { sectionOf } from "./catalog-sections";

// English display names and photos for the individual alfajor flavors,
// matched on the variation's name in Square (which is in Spanish). Square
// only holds one photo per item (the two-alfajor plate), so each flavor's own
// photo lives in the repo until Square has one per variation.
const FLAVORS: { match: RegExp; name: string; src: string }[] = [
  { match: /maicena/i, name: "Shortbread Alfajor", src: "/photos/alfajor-maicena.webp" },
  { match: /chocol/i, name: "Chocolate Alfajor", src: "/photos/alfajor-chocolate.webp" },
];

// Alfajores live in Square as ONE item with a variation per flavor (Maicena,
// Chocolate), but on the site each flavor should be its own product card,
// with its own page, like a box of empanadas is. So alfajor items with more
// than one variation are split into one synthetic "item" per variation. The
// synthetic item's id is the variation's Square id, so /shop/<id>, the cart
// and checkout all keep working (checkout only ever uses variationId).
// Everything else passes through unchanged. When the business starts selling
// alfajor boxes as their own Square items this split stops applying to them.
function splitAlfajorVariations(item: CatalogItem): CatalogItem[] {
  if (sectionOf(item) !== "alfajores" || item.variations.length < 2) {
    return [item];
  }
  return item.variations.map((variation) => {
    const flavor = FLAVORS.find((f) => f.match.test(variation.name));
    const name =
      flavor?.name ??
      (/alfajor/i.test(variation.name)
        ? variation.name.trim()
        : `${item.name.trim()} - ${variation.name.trim()}`);
    return {
      ...item,
      id: variation.id,
      name,
      imageUrl: flavor?.src ?? item.imageUrl,
      variations: [variation],
    };
  });
}

// What the storefront sells: the Square catalog with alfajor flavors split
// into their own products. Use this (not getCatalogItems) for anything
// customer-facing: shop grid, product pages, cart, sitemap.
export async function getShopProducts(): Promise<CatalogItem[]> {
  const items = await getCatalogItems();
  return items.flatMap(splitAlfajorVariations);
}
