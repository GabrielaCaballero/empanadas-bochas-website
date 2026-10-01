const SQUARE_BASE_URL = "https://connect.squareup.com";
const SQUARE_SANDBOX_BASE_URL = "https://connect.squareupsandbox.com";
const SQUARE_VERSION = "2025-01-23";

// Controls checkout + order-lookup only (SQUARE_CHECKOUT_ENV=sandbox) — the
// catalog always reads from production regardless, since the menu/prices
// shown to visitors should always be real. Sandbox and production are
// separate Square accounts, so payment creation and order lookups must use
// the same one or a just-completed sandbox order will never be found.
function checkoutCredentials() {
  const useSandbox = process.env.SQUARE_CHECKOUT_ENV === "sandbox";
  const token = useSandbox
    ? process.env.SQUARE_SANDBOX_ACCESS_TOKEN
    : process.env.SQUARE_PRODUCTION_ACCESS_TOKEN;
  const locationId = useSandbox
    ? process.env.SQUARE_SANDBOX_LOCATION_ID
    : process.env.SQUARE_PRODUCTION_LOCATION_ID;
  const baseUrl = useSandbox ? SQUARE_SANDBOX_BASE_URL : SQUARE_BASE_URL;

  if (!token || !locationId) {
    throw new Error(
      useSandbox
        ? "Missing Square sandbox credentials"
        : "Missing Square production credentials",
    );
  }

  return { token, locationId, baseUrl };
}

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
    `${SQUARE_BASE_URL}/v2/catalog/list?types=ITEM,IMAGE,MODIFIER_LIST,TAX`,
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

    // Pizza (slices and whole pies) and the corporate/private "Event Pop Up"
    // booking item are pop-up- or inquiry-only, not sold as a normal cart
    // purchase through the website, so both are excluded from the catalog
    // everywhere on the site.
    const nameLower: string = itemData.name?.toLowerCase() ?? "";
    if (nameLower.includes("pizza") || nameLower.includes("slice")) continue;
    if (nameLower.includes("event pop up")) continue;

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

export type SalesTax = {
  name: string;
  // Decimal rate (0.08875 for 8.875%), not the raw percentage string Square
  // returns — both the client (for the estimated subtotal/tax/total
  // breakdown) and the order-building code want a plain number to multiply
  // by, not a "8.875" string to parse twice.
  rate: number;
};

// Pulled live from whatever's configured as an enabled tax in Square's own
// Catalog (Square Dashboard → Settings → Taxes) rather than hardcoded here,
// so it always matches what Square itself would charge and never needs a
// code change if the rate changes. Always reads the business's real
// (production) catalog, same as getCatalogItems — tax is a fact about the
// business, not something that should differ between sandbox and
// production checkout. Returns null if no enabled tax is configured, in
// which case no tax is added anywhere (same as today's behavior).
export async function getActiveSalesTax(): Promise<SalesTax | null> {
  const objects = await fetchCatalogObjects();
  const tax = objects.find(
    (o) => o.type === "TAX" && !o.is_deleted && o.tax_data?.enabled,
  );
  if (!tax) return null;

  const percentage = parseFloat(tax.tax_data.percentage);
  if (!Number.isFinite(percentage)) return null;

  return {
    name: (tax.tax_data.name as string)?.trim() || "Sales Tax",
    rate: percentage / 100,
  };
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

type SquareErrorDetail = {
  category?: string;
  code?: string;
  detail?: string;
  field?: string;
};

// Square's error responses are structured (a list of {category, code,
// detail, field}), but a plain Error swallows that into one opaque string —
// which is exactly how a malformed-but-HTML5-valid email (e.g. "a@gmail"
// with no TLD) used to surface to the customer as a bare "Could not create
// payment link" with no indication of what was actually wrong. Parsing it
// here lets callers (the checkout route) show a targeted message instead.
export class SquareApiError extends Error {
  status: number;
  errors: SquareErrorDetail[];

  constructor(status: number, rawBody: string) {
    let errors: SquareErrorDetail[] = [];
    try {
      const parsed = JSON.parse(rawBody);
      if (Array.isArray(parsed?.errors)) errors = parsed.errors;
    } catch {
      // Square almost always returns JSON on an error response, but this
      // guards against the rare case it doesn't rather than throwing while
      // already handling an error.
    }
    super(`Square API error (${status}): ${errors[0]?.detail ?? rawBody}`);
    this.name = "SquareApiError";
    this.status = status;
    this.errors = errors;
  }

  isEmailError(): boolean {
    return this.errors.some(
      (e) =>
        e.field?.toLowerCase().includes("email") ||
        e.code?.toUpperCase().includes("EMAIL"),
    );
  }
}

// Line items are ad-hoc (name + price) rather than referencing catalog
// objects, since Square requires a location-scoped catalog reference for
// that and this checkout intentionally stays simple/itemized-by-name.
//
// Created WITHOUT a redirect_url, then set in a second call
// (setPaymentLinkRedirect below) — not because Square can't take one here,
// but because the redirect URL needs to encode the order's own ID (see
// getOrderById further down this file) for /checkout/success to look the
// order up directly, and that ID isn't known until THIS call returns.
// Square's Payment Links API doesn't support creating a link against a
// pre-existing order (confirmed directly against the sandbox: order.id is
// rejected as "Read-only field is calculated and cannot be set by a
// client" even alongside a full order body) — so the order has to be
// created here, inline, same as before.
export async function createPaymentLink(
  lineItems: CheckoutLineItem[],
  buyerEmail?: string,
): Promise<{
  id: string;
  url: string;
  orderId: string;
  version: number;
  totalCents: number;
}> {
  const { token, locationId, baseUrl } = checkoutCredentials();

  // Ad-hoc, scope: "ORDER" tax rather than referencing the catalog TAX
  // object by ID — line items here are already ad-hoc (name + price, not
  // catalog references, see the comment above), and an order-scoped tax
  // doesn't need one: Square computes it off the order's own line-item
  // total automatically, the same "it just works" behavior as the catalog
  // config this rate is read from.
  const salesTax = await getActiveSalesTax();

  const res = await fetch(`${baseUrl}/v2/online-checkout/payment-links`, {
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
        taxes: salesTax
          ? [
              {
                uid: "sales-tax",
                name: salesTax.name,
                percentage: (salesTax.rate * 100).toString(),
                scope: "ORDER",
                type: "ADDITIVE",
              },
            ]
          : undefined,
      },
      // Pre-fills the buyer's email on Square's hosted checkout page so
      // they don't have to retype what they already gave us.
      pre_populated_data: buyerEmail
        ? { buyer_email: buyerEmail }
        : undefined,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new SquareApiError(res.status, body);
  }

  const data = await res.json();
  // Square returns the order it just built (including the computed tax)
  // alongside the payment link itself — reading the real total from there
  // instead of recomputing it ourselves means the amount encoded into
  // CheckoutContext (used by /checkout/success's fallback order-matching)
  // can never drift from what Square actually charges, even by a rounding
  // cent.
  const createdOrder = data.related_resources?.orders?.[0];
  return {
    id: data.payment_link.id,
    orderId: data.payment_link.order_id,
    url: data.payment_link.url,
    version: data.payment_link.version,
    totalCents: createdOrder?.total_money?.amount ?? 0,
  };
}

// Attaches checkout_options.redirect_url to an already-created payment
// link (see createPaymentLink's doc comment for why this is split out) —
// confirmed working directly against the sandbox API. `version` is Square's
// optimistic-concurrency field, required on any update and always the one
// just returned from createPaymentLink since nothing else modifies the
// link in between.
export async function setPaymentLinkRedirect(
  paymentLinkId: string,
  version: number,
  redirectUrl: string,
): Promise<void> {
  const { token, baseUrl } = checkoutCredentials();

  const res = await fetch(
    `${baseUrl}/v2/online-checkout/payment-links/${paymentLinkId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Square-Version": SQUARE_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment_link: {
          version,
          checkout_options: { redirect_url: redirectUrl },
        },
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new SquareApiError(res.status, body);
  }
}

export type OrderSummary = {
  id: string;
  createdAt: string;
  state: string;
  totalCents: number;
  totalTaxCents: number;
  lineItems: {
    name: string;
    quantity: string;
    note?: string;
    // Pre-tax (gross_sales_money), not total_money — total_money folds each
    // line's share of the order-level tax in, which would otherwise make a
    // receipt show "1x Alfajor $5.44" with no explanation. totalTaxCents
    // above is the one clean, order-level tax line a receipt/email should
    // actually show instead.
    totalCents: number;
  }[];
};

function mapOrderSummary(o: SquareObject): OrderSummary {
  return {
    id: o.id,
    createdAt: o.created_at,
    state: o.state,
    totalCents: o.total_money?.amount ?? 0,
    totalTaxCents: o.total_tax_money?.amount ?? 0,
    lineItems: (o.line_items ?? []).map((li: SquareObject) => ({
      name: li.name,
      quantity: li.quantity,
      note: li.note,
      totalCents: li.gross_sales_money?.amount ?? li.total_money?.amount ?? 0,
    })),
  };
}

// A DRAFT order has been created but never paid (e.g. the buyer abandoned
// Square's hosted checkout); CANCELED is self-explanatory. Anything else
// means a tender was actually applied.
function isPaidOrderState(state: string) {
  return state !== "DRAFT" && state !== "CANCELED";
}

// Direct lookup by ID — Square's strongly-consistent read path, unlike
// /v2/orders/search below (confirmed via direct sandbox testing: a
// just-created order was immediately found by ID but NOT yet by search,
// even several seconds later and with zero filters). This is now the
// primary way /checkout/success resolves the order it was redirected for,
// since the order ID is known at payment-link-creation time and threaded
// through via CheckoutContext — findRecentMatchingOrder below is kept only
// as a fallback (an in-flight redirect link from before this existed, or a
// transient failure on this call).
export async function getOrderById(orderId: string): Promise<OrderSummary | null> {
  const { token, locationId, baseUrl } = checkoutCredentials();

  const res = await fetch(`${baseUrl}/v2/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Square-Version": SQUARE_VERSION,
    },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Square order lookup failed: ${res.status}`);
  }

  const data = await res.json();
  const order = data.order;
  // location_id is checked defensively — not expected to ever mismatch
  // since the order was created against this same location, but a stray ID
  // from another location should never be treated as this customer's order.
  if (!order || order.location_id !== locationId) return null;
  if (!isPaidOrderState(order.state)) return null;

  return mapOrderSummary(order);
}

// Fallback only (see getOrderById above): finds a recent paid order by
// matching total+recency rather than ID. This deliberately doesn't filter
// by customer/email — Square's hosted checkout doesn't reliably attach a
// customer record to every completed order (confirmed via sandbox testing,
// where the "Test Payment" simulator never does). Known weakness: two
// different customers checking out with the same total within the match
// window can collide, since this returns the first (most recent) match
// regardless of whose it actually is — exactly what getOrderById avoids.
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

// Recent orders at this location, regardless of customer — used to find the
// order a just-completed checkout redirect refers to (see
// findRecentMatchingOrder above).
export async function getRecentOrders(withinMs: number): Promise<OrderSummary[]> {
  const { token, locationId, baseUrl } = checkoutCredentials();

  const res = await fetch(`${baseUrl}/v2/orders/search`, {
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
          date_time_filter: {
            created_at: {
              start_at: new Date(Date.now() - withinMs).toISOString(),
            },
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
