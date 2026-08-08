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

export type CheckoutLineItem = {
  name: string;
  quantity: number;
  unitPriceCents: number;
  note?: string;
};

// Line items are ad-hoc (name + price) rather than referencing catalog
// objects, since Square requires a location-scoped catalog reference for
// that and this checkout intentionally stays simple/itemized-by-name.
export async function createPaymentLink(
  lineItems: CheckoutLineItem[],
  redirectUrl?: string,
): Promise<{ id: string; url: string; orderId: string }> {
  const token = process.env.SQUARE_PRODUCTION_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_PRODUCTION_LOCATION_ID;
  if (!token || !locationId) {
    throw new Error("Missing Square production credentials");
  }

  const res = await fetch(
    `${SQUARE_BASE_URL}/v2/online-checkout/payment-links`,
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
        checkout_options: redirectUrl
          ? { redirect_url: redirectUrl }
          : undefined,
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

export type OrderSummary = {
  id: string;
  createdAt: string;
  state: string;
  totalCents: number;
  lineItems: { name: string; quantity: string; note?: string }[];
};

function mapOrderSummary(o: SquareObject): OrderSummary {
  return {
    id: o.id,
    createdAt: o.created_at,
    state: o.state,
    totalCents: o.total_money?.amount ?? 0,
    lineItems: (o.line_items ?? []).map((li: SquareObject) => ({
      name: li.name,
      quantity: li.quantity,
      note: li.note,
    })),
  };
}

// A DRAFT order has been created but never paid (e.g. the buyer abandoned
// Square's hosted checkout); CANCELED is self-explanatory. Anything else
// means a tender was actually applied.
function isPaidOrderState(state: string) {
  return state !== "DRAFT" && state !== "CANCELED";
}

// Finds the order a just-completed checkout redirect refers to: there's no
// order ID to match on directly (see /checkout/success), so the best signal
// is a paid order for this customer with a matching total, created recently.
export function findRecentMatchingOrder(
  orders: OrderSummary[],
  totalCents: number,
  withinMs: number,
): OrderSummary | undefined {
  const now = Date.now();
  return orders.find(
    (o) =>
      o.totalCents === totalCents &&
      now - new Date(o.createdAt).getTime() < withinMs,
  );
}

// Square automatically creates/matches a Customer record from the email
// entered on its hosted checkout page, so order history can be looked up by
// email without our own accounts/database — this only covers orders paid
// through the "Pickup at an Event" flow (the only one that goes through
// Square Checkout at time of purchase).
async function findCustomerIdByEmail(email: string): Promise<string | null> {
  const token = process.env.SQUARE_PRODUCTION_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Missing SQUARE_PRODUCTION_ACCESS_TOKEN env var");
  }

  const res = await fetch(`${SQUARE_BASE_URL}/v2/customers/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Square-Version": SQUARE_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: {
        filter: {
          email_address: { exact: email },
        },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Square customer search failed: ${res.status}`);
  }

  const data = await res.json();
  return data.customers?.[0]?.id ?? null;
}

export async function getOrdersByEmail(email: string): Promise<OrderSummary[]> {
  const token = process.env.SQUARE_PRODUCTION_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_PRODUCTION_LOCATION_ID;
  if (!token || !locationId) {
    throw new Error("Missing Square production credentials");
  }

  const customerId = await findCustomerIdByEmail(email);
  if (!customerId) return [];

  const res = await fetch(`${SQUARE_BASE_URL}/v2/orders/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Square-Version": SQUARE_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      location_ids: [locationId],
      query: {
        filter: {
          customer_filter: {
            customer_ids: [customerId],
          },
        },
        sort: {
          sort_field: "CREATED_AT",
          sort_order: "DESC",
        },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Square order search failed: ${res.status}`);
  }

  const data = await res.json();
  const orders: SquareObject[] = data.orders ?? [];

  return orders
    .filter((o) => isPaidOrderState(o.state))
    .map(mapOrderSummary);
}
