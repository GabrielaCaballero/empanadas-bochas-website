"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/lib/cart-context";
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

export default function CartClient({
  sauceVariations,
  productsById,
  suggestedProduct,
}: {
  sauceVariations: SauceVariation[];
  productsById: Record<string, Product>;
  suggestedProduct: SuggestedProduct | null;
}) {
  const {
    items,
    removeItem,
    updateQuantity,
    totalCents,
    sauces,
    setSauceCount,
    totalEmpanadaCount,
    freeSauceAllotment,
  } = useCart();

  const totalSaucesSelected = Object.values(sauces).reduce((a, b) => a + b, 0);
  const paidSauces = Math.max(0, totalSaucesSelected - freeSauceAllotment);
  const saucePriceCents = sauceVariations[0]?.priceCents ?? 0;
  const sauceCostCents = paidSauces * saucePriceCents;
  const grandTotalCents = totalCents + sauceCostCents;

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
                className="flex items-center gap-4 rounded-3xl bg-cream p-4 sm:p-5"
              >
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
              </li>
            ))}
          </ul>

          {totalEmpanadaCount > 0 && sauceVariations.length > 0 && (
            <div className="rounded-3xl bg-cream p-6">
              <h2 className="font-display text-lg font-semibold text-maroon">
                Sauces
              </h2>
              <p className="mt-1 text-sm text-maroon/70">
                {freeSauceAllotment > 0
                  ? `You've got ${freeSauceAllotment} free sauce${freeSauceAllotment > 1 ? "s" : ""} with ${totalEmpanadaCount} empanadas. Extra sauces are ${formatPrice(saucePriceCents)} each.`
                  : `Add 3+ empanadas to unlock a free sauce. Sauces are ${formatPrice(saucePriceCents)} each.`}
              </p>

              <div className="mt-4 flex flex-col gap-2">
                {sauceVariations.map((variation) => (
                  <div
                    key={variation.id}
                    className="flex items-center justify-between rounded-xl bg-background px-4 py-2"
                  >
                    <span className="text-maroon">{variation.name}</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setSauceCount(
                            variation.name,
                            (sauces[variation.name] ?? 0) - 1,
                          )
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-maroon/30 text-maroon"
                      >
                        −
                      </button>
                      <span className="w-4 text-center text-maroon">
                        {sauces[variation.name] ?? 0}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setSauceCount(
                            variation.name,
                            (sauces[variation.name] ?? 0) + 1,
                          )
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-maroon/30 text-maroon"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {totalSaucesSelected > 0 && (
                <p className="mt-3 text-sm text-maroon/70">
                  {totalSaucesSelected} sauce{totalSaucesSelected > 1 ? "s" : ""}{" "}
                  selected — {Math.min(totalSaucesSelected, freeSauceAllotment)}{" "}
                  free
                  {paidSauces > 0 &&
                    `, ${paidSauces} × ${formatPrice(saucePriceCents)} = ${formatPrice(sauceCostCents)}`}
                </p>
              )}
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
              <span>Empanadas</span>
              <span>{formatPrice(totalCents)}</span>
            </div>
            {sauceCostCents > 0 && (
              <div className="flex items-center justify-between">
                <span>Sauces</span>
                <span>{formatPrice(sauceCostCents)}</span>
              </div>
            )}
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
