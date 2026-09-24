"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type CartLineItem = {
  id: string;
  itemId: string;
  variationId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  flavors?: Record<string, number>;
};

type CartContextValue = {
  items: CartLineItem[];
  addItem: (item: Omit<CartLineItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalCents: number;
  totalCount: number;
  sauces: Record<string, number>;
  setSauceCount: (name: string, count: number) => void;
  totalEmpanadaCount: number;
  freeSauceAllotment: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "empanadas-bochas-cart";

type StoredCart = {
  items: CartLineItem[];
  sauces: Record<string, number>;
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLineItem[]>([]);
  const [sauces, setSauces] = useState<Record<string, number>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Intentionally reading localStorage post-mount (not in a lazy useState
    // initializer) so server and first client render match, avoiding a
    // hydration mismatch — the eslint rule's "cascading renders" concern
    // doesn't apply since this only ever runs once, on mount.
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: StoredCart = JSON.parse(raw);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(parsed.items ?? []);
        setSauces(parsed.sauces ?? {});
      }
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const toStore: StoredCart = { items, sauces };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  }, [items, sauces, hydrated]);

  function addItem(item: Omit<CartLineItem, "id">) {
    const id = `${item.itemId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setItems((prev) => [...prev, { ...item, id }]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateQuantity(id: string, quantity: number) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i)),
    );
  }

  function clearCart() {
    setItems([]);
    setSauces({});
    // Also written directly (not just via state) because this can run in a
    // child's mount effect (see CheckoutSuccessClient) that fires before
    // CartProvider's own localStorage-hydration effect above — without this,
    // that later hydration read would reload the pre-clear cart from storage
    // and clobber the clear.
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: [], sauces: {} }));
  }

  function setSauceCount(name: string, count: number) {
    setSauces((prev) => ({ ...prev, [name]: Math.max(0, count) }));
  }

  const totalCents = items.reduce(
    (sum, i) => sum + i.unitPriceCents * i.quantity,
    0,
  );
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);

  // Empanada count only comes from items with a flavor breakdown (individual
  // empanadas and combos both carry `flavors`; other menu items don't).
  const totalEmpanadaCount = items.reduce((sum, i) => {
    if (!i.flavors) return sum;
    return sum + Object.values(i.flavors).reduce((a, b) => a + b, 0);
  }, 0);
  // Sauces are a bundled perk, not a separately priced addon — this is both
  // the free amount AND the hard cap on how many can be selected at each
  // tier (any order still gets to pick one, even below the first tier).
  const freeSauceAllotment =
    totalEmpanadaCount >= 12
      ? 6
      : totalEmpanadaCount >= 6
        ? 4
        : totalEmpanadaCount >= 3
          ? 2
          : totalEmpanadaCount >= 1
            ? 1
            : 0;

  // A sauce selection made at a higher tier (e.g. 6 sauces with 12+
  // empanadas) would otherwise stick around after items are removed and the
  // allotment drops — since sauces are meant to be a capped free perk, not a
  // paid addon, that stale over-allotment selection needs trimming back down
  // rather than being left to slip through as extra (and, without this,
  // implicitly-paid) sauces at checkout. Computed as derived state each
  // render (not corrected via an effect) so it's never a render behind and
  // never risks a setState-driven cascade — `rawSauces` is what's actually
  // stored/persisted, `sauces` below is always the clamped view of it.
  const rawSauceTotal = Object.values(sauces).reduce((a, b) => a + b, 0);
  const clampedSauces =
    rawSauceTotal <= freeSauceAllotment
      ? sauces
      : (() => {
          let excess = rawSauceTotal - freeSauceAllotment;
          const next = { ...sauces };
          for (const key of Object.keys(next)) {
            if (excess <= 0) break;
            const take = Math.min(next[key], excess);
            next[key] -= take;
            excess -= take;
          }
          return next;
        })();

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalCents,
        totalCount,
        sauces: clampedSauces,
        setSauceCount,
        totalEmpanadaCount,
        freeSauceAllotment,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
