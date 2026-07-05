const SQUARE_BASE_URL = "https://connect.squareup.com";
const SQUARE_VERSION = "2025-01-23";

export type CatalogVariation = {
  id: string;
  name: string;
  priceCents: number | null;
};

export type CatalogItem = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  variations: CatalogVariation[];
  flavors: string[] | null;
};

type SquareObject = Record<string, any>;

async function fetchCatalogObjects(): Promise<SquareObject[]> {
  const token = process.env.SQUARE_PRODUCTION_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Missing SQUARE_PRODUCTION_ACCESS_TOKEN env var");
  }

  const res = await fetch(
    `${SQUARE_BASE_URL}/v2/catalog/list?types=ITEM,IMAGE,MODIFIER_LIST`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Square-Version": SQUARE_VERSION,
      },
      next: { revalidate: 300 },
    },
  );

  if (!res.ok) {
    throw new Error(`Square catalog request failed: ${res.status}`);
  }

  const data = await res.json();
  return data.objects ?? [];
}

export async function getCatalogItems(): Promise<CatalogItem[]> {
  const objects = await fetchCatalogObjects();

  const imageUrlsById = new Map<string, string>();
  const flavorsByModifierListId = new Map<string, string[]>();

  for (const obj of objects) {
    if (obj.type === "IMAGE" && obj.image_data?.url) {
      imageUrlsById.set(obj.id, obj.image_data.url);
    }
    if (obj.type === "MODIFIER_LIST") {
      const flavors = (obj.modifier_list_data?.modifiers ?? [])
        .map((m: SquareObject) => m.modifier_data?.name)
        .filter(Boolean);
      flavorsByModifierListId.set(obj.id, flavors);
    }
  }

  const items: CatalogItem[] = [];

  for (const obj of objects) {
    if (obj.type !== "ITEM" || obj.is_deleted) continue;
    const itemData = obj.item_data;

    const imageId: string | undefined = itemData.image_ids?.[0];
    const imageUrl = imageId ? (imageUrlsById.get(imageId) ?? null) : null;

    const modifierListId: string | undefined =
      itemData.modifier_list_info?.[0]?.modifier_list_id;
    const flavors = modifierListId
      ? (flavorsByModifierListId.get(modifierListId) ?? null)
      : null;

    const variations: CatalogVariation[] = (itemData.variations ?? []).map(
      (v: SquareObject) => ({
        id: v.id,
        name: v.item_variation_data?.name ?? "Regular",
        priceCents: v.item_variation_data?.price_money?.amount ?? null,
      }),
    );

    items.push({
      id: obj.id,
      name: itemData.name,
      description: itemData.description ?? null,
      imageUrl,
      variations,
      flavors,
    });
  }

  return items;
}

export async function getCatalogItem(id: string): Promise<CatalogItem | null> {
  const items = await getCatalogItems();
  return items.find((item) => item.id === id) ?? null;
}

export function formatPrice(cents: number | null): string | null {
  if (cents == null) return null;
  return `$${(cents / 100).toFixed(2)}`;
}
