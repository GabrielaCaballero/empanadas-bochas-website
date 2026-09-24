"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useCart,
  itemSauceAllotment,
  type CartLineItem,
} from "@/lib/cart-context";
import { formatPrice } from "@/lib/square";
import { whatsAppUrl } from "@/lib/business-info";

type SauceVariation = {
  id: string;
  name: string;
  priceCents: number;
};

type Product = {
  name: string;
  imageUrl: string | null;
};

type SuggestedProduct = {
  id: string;
  name: string;
  imageUrl: string | null;
  priceCents: number | null;
};

function RemoveIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function Thumbnail({
  product,
  className,
}: {
  product: Product | undefined;
  className: string;
}) {
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-2xl bg-cream ${className}`}>
      {product?.imageUrl && (
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          sizes="96px"
        />
      )}
    </div>
  );
}

// The free sauces that came bundled with THIS box, grouped and picked right
// underneath it — each box carries its own allotment (see
// itemSauceAllotment in cart-context.tsx) instead of one pooled total for
// the whole cart.
function ItemSauces({
  item,
  sauceVariations,
  setItemSauceCount,
}: {
  item: CartLineItem;
  sauceVariations: SauceVariation[];
  setItemSauceCount: (id: string, sauceName: string, count: number) => void;
}) {
  const allotment = itemSauceAllotment(item);
  if (allotment <= 0 || sauceVariations.length === 0) return null;

  const itemSauceCounts = item.sauces ?? {};
  const totalSelected = Object.values(itemSauceCounts).reduce(
    (a, b) => a + b,
    0,
  );
  const capReached = totalSelected >= allotment;

  return (
    <div className="rounded-2xl bg-background/70 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-maroon/60">
          Free sauce{allotment > 1 ? "s" : ""} with this box
        </span>
        <span className="text-xs font-semibold text-maroon">
          {totalSelected}/{allotment}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {sauceVariations.map((variation) => {
          const count = itemSauceCounts[variation.name] ?? 0;
          return (
            <div
              key={variation.id}
              className="flex items-center gap-2 rounded-full border border-maroon/15 bg-cream px-3 py-1"
            >
              <span className="text-sm text-maroon">{variation.name}</span>
              <button
                type="button"
                onClick={() =>
                  setItemSauceCount(item.id, variation.name, count - 1)
                }
                className="flex h-5 w-5 items-center justify-center rounded-full border border-maroon/30 text-xs text-maroon"
              >
                −
              </button>
              <span className="w-3 text-center text-sm text-maroon">
                {count}
              </span>
              <button
                type="button"
                disabled={capReached}
                onClick={() =>
                  setItemSauceCount(item.id, variation.name, count + 1)
                }
                className="flex h-5 w-5 items-center justify-center rounded-full border border-maroon/30 text-xs text-maroon disabled:cursor-not-allowed disabled:opacity-30"
              >
                +
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CartClient({
  sauceItemId,
  sauceVariations,
  productsById,
  suggestedProduct,
}: {
  sauceItemId: string | null;
  sauceVariations: SauceVariation[];
  productsById: Record<string, Product>;
  suggestedProduct: SuggestedProduct | null;
}) {
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    setItemSauceCount,
    totalCents,
  } = useCart();

  // Extra sauces bought beyond the free allotment are just a normal,
  // separately-priced cart item (same shape as any other product) rather
  // than routed through the free-sauce mechanism above — so no extra cost
  // math is needed here, it's already folded into totalCents.
  const grandTotalCents = totalCents;

  function addOrIncrementSauce(variation: SauceVariation) {
    if (!sauceItemId) return;
    const existing = items.find(
      (i) =>
        i.itemId === sauceItemId &&
        i.variationId === variation.id &&
        !i.flavors,
    );
    if (existing) {
      updateQuantity(existing.id, existing.quantity + 1);
    } else {
      addItem({
        itemId: sauceItemId,
        variationId: variation.id,
        name: `Sauce - ${variation.name}`,
        unitPriceCents: variation.priceCents,
        quantity: 1,
      });
    }
  }

  const searchParams = useSearchParams();
  const orderError = searchParams.get("error") === "order";
  const errorBanner = orderError && (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
      <p className="font-semibold text-red-700">
        Something went wrong finishing your order.
      </p>
      <p className="mt-1 text-sm text-red-700/80">
        Your cart is still here, so you can try checking out again. If this
        keeps happening, message us on WhatsApp and we&rsquo;ll sort it out
        directly.
      </p>
      <a
        href={whatsAppUrl("Hi! I ran into an error trying to check out on the website.")}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
      >
        Message us on WhatsApp
      </a>
    </div>
  );

  if (items.length === 0) {
    return (
      <section className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <h1 className="font-display text-4xl font-semibold text-maroon">
          Your cart
        </h1>
        {errorBanner && <div className="mt-6">{errorBanner}</div>}
        <p className="mt-3 max-w-xl text-maroon/70">
          Your cart is empty — but it doesn&rsquo;t have to be.
        </p>

        {suggestedProduct && (
          <Link
            href={`/shop/${suggestedProduct.id}`}
            className="group mt-8 flex items-center gap-5 rounded-3xl bg-cream p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <Thumbnail
              product={suggestedProduct}
              className="h-24 w-24 sm:h-28 sm:w-28"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-maroon/60">
                Pick up where you left off
              </p>
              <h2 className="mt-0.5 font-display text-xl font-semibold text-maroon">
                {suggestedProduct.name}
              </h2>
              {suggestedProduct.priceCents != null && (
                <p className="mt-1 font-medium text-terracotta">
                  {formatPrice(suggestedProduct.priceCents)}
                </p>
              )}
              <span className="mt-2 inline-block text-sm font-semibold text-terracotta group-hover:text-rust">
                Shop this →
              </span>
            </div>
          </Link>
        )}

        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-terracotta px-6 py-3 font-semibold text-background transition-colors hover:bg-rust"
        >
          Shop the Menu
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
      <h1 className="font-display text-4xl font-semibold text-maroon">
        Your cart
      </h1>
      {errorBanner && <div className="mt-6">{errorBanner}</div>}
      <p className="mt-2 text-sm text-maroon/60">
        Want an odd number of empanadas? Add a combo and a few individual
        empanadas separately — they all add up in one cart.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 rounded-3xl bg-cream p-4 sm:p-5"
              >
                <div className="flex items-center gap-4">
                  <Thumbnail
                    product={productsById[item.itemId]}
                    className="h-20 w-20 sm:h-24 sm:w-24"
                  />

                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-lg font-semibold text-maroon">
                      {item.name}
                    </h2>

                    {item.flavors ? (
                      <p className="mt-1 text-sm text-maroon/70">
                        {Object.entries(item.flavors)
                          .filter(([, count]) => count > 0)
                          .map(([flavor, count]) => `${count}x ${flavor}`)
                          .join(", ")}
                      </p>
                    ) : (
                      <div className="mt-2 flex items-center gap-2 text-sm text-maroon/70">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-maroon/30"
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-maroon/30"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <p className="font-medium text-terracotta">
                      {formatPrice(item.unitPriceCents * item.quantity)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.name} from cart`}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-maroon/40 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <RemoveIcon />
                    </button>
                  </div>
                </div>

                {item.flavors && (
                  <ItemSauces
                    item={item}
                    sauceVariations={sauceVariations}
                    setItemSauceCount={setItemSauceCount}
                  />
                )}
              </li>
            ))}
          </ul>

          {sauceItemId && sauceVariations.length > 0 && (
            <div className="rounded-3xl bg-cream p-6">
              <h2 className="font-display text-lg font-semibold text-maroon">
                Add extra sauces
              </h2>
              <p className="mt-1 text-sm text-maroon/70">
                Want more on the side? Add extra sauces here, on top of the
                free ones that come with your boxes.
              </p>

              <div className="mt-4 flex flex-col gap-2">
                {sauceVariations.map((variation) => (
                  <div
                    key={variation.id}
                    className="flex items-center justify-between rounded-xl bg-background px-4 py-2"
                  >
                    <span className="text-maroon">
                      {variation.name}
                      <span className="ml-2 text-sm text-maroon/50">
                        {formatPrice(variation.priceCents)}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => addOrIncrementSauce(variation)}
                      className="rounded-full border border-terracotta px-4 py-1.5 text-sm font-semibold text-terracotta transition-colors hover:bg-terracotta hover:text-background"
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Link
            href="/shop"
            className="text-sm font-semibold text-terracotta hover:text-rust"
          >
            ← Continue shopping
          </Link>
        </div>

        <div className="h-fit rounded-3xl bg-cream p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-semibold text-maroon">
            Order summary
          </h2>
          <div className="mt-4 flex flex-col gap-2 text-sm text-maroon/70">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(totalCents)}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-maroon/10 pt-4 text-lg font-semibold text-maroon">
            <span>Total</span>
            <span>{formatPrice(grandTotalCents)}</span>
          </div>
          <Link
            href="/checkout"
            className="mt-6 block w-full rounded-full bg-terracotta px-6 py-3 text-center font-semibold text-background transition-colors hover:bg-rust"
          >
            Checkout
          </Link>
        </div>
      </div>
    </section>
  );
}
