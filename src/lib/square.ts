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
  requiredFlavorCount: number | null;
};

// Square's catalog JSON is deeply nested and only partially used here, so a
// loose type is the pragmatic choice for this internal parsing helper.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // Pizza (slices and whole pies) is pop-up-only, not sold through the
    // website, so it's excluded from the catalog everywhere on the site.
    const nameLower: string = itemData.name?.toLowerCase() ?? "";
    if (nameLower.includes("pizza") || nameLower.includes("slice")) continue;

    const imageId: string | undefined = itemData.image_ids?.[0];
    const imageUrl = imageId ? (imageUrlsById.get(imageId) ?? null) : null;

    const modifierInfo = itemData.modifier_list_info?.[0];
    const modifierListId: string | undefined = modifierInfo?.modifier_list_id;
    const flavors = modifierListId
      ? (flavorsByModifierListId.get(modifierListId) ?? null)
      : null;
    const requiredFlavorCount =
      flavors && modifierInfo?.max_selected_modifiers > 0
        ? modifierInfo.max_selected_modifiers
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
      requiredFlavorCount,
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

const SQUARE_SANDBOX_BASE_URL = "https://connect.squareupsandbox.com";

export type CheckoutLineItem = {
  name: string;
  quantity: number;
  unitPriceCents: number;
  note?: string;
};

// Uses the Sandbox environment on purpose — checkout hasn't been switched to
// production yet (see docs/PRD.md). Line items are ad-hoc (name + price)
// rather than referencing catalog objects, since the Sandbox account has an
// entirely separate, empty catalog from the real production one.
export async function createPaymentLink(
  lineItems: CheckoutLineItem[],
): Promise<{ id: string; url: string; orderId: string }> {
  const token = process.env.SQUARE_SANDBOX_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_SANDBOX_LOCATION_ID;
  if (!token || !locationId) {
    throw new Error("Missing Square sandbox credentials");
  }

  const res = await fetch(
    `${SQUARE_SANDBOX_BASE_URL}/v2/online-checkout/payment-links`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Square-Version": SQUARE_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idempotency_key: crypto.randomUUID(),
        order: {
          location_id: locationId,
          line_items: lineItems.map((item) => ({
            name: item.name,
            quantity: String(item.quantity),
            note: item.note,
            base_price_money: {
              amount: item.unitPriceCents,
              currency: "USD",
            },
          })),
        },
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Square payment link request failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  return {
    id: data.payment_link.id,
    url: data.payment_link.url,
    orderId: data.payment_link.order_id,
  };
}
