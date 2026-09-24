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
  // Free sauces picked for THIS box/item specifically (see
  // itemSauceAllotment below) — sauces are grouped per box rather than
  // pooled across the whole cart, so this lives on the item, not globally.
  sauces?: Record<string, number>;
};

type CartContextValue = {
  items: CartLineItem[];
  addItem: (item: Omit<CartLineItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setItemSauceCount: (id: string, sauceName: string, count: number) => void;
  clearCart: () => void;
  totalCents: number;
  totalCount: number;
  totalEmpanadaCount: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "empanadas-bochas-cart";

type StoredCart = {
  items: CartLineItem[];
};

// The free-sauce perk scales with how many empanadas are IN A GIVEN BOX —
// Box of 3 → 2 sauces, Box of 6 → 4, Box of 12(+2 promo) → 6, and any
// single empanada still gets to pick 1. Applied per cart item (not pooled
// across the cart) so it can be shown as a sub-picker grouped under each
// box, per the business's request.
export function sauceAllotmentForCount(empanadaCount: number): number {
  if (empanadaCount >= 12) return 6;
  if (empanadaCount >= 6) return 4;
  if (empanadaCount >= 3) return 2;
  if (empanadaCount >= 1) return 1;
  return 0;
}

export function itemEmpanadaCount(item: CartLineItem): number {
  if (!item.flavors) return 0;
  return Object.values(item.flavors).reduce((a, b) => a + b, 0);
}

export function itemSauceAllotment(item: CartLineItem): number {
  return sauceAllotmentForCount(itemEmpanadaCount(item));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLineItem[]>([]);
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
      }
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const toStore: StoredCart = { items };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  }, [items, hydrated]);

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
    // Also written directly (not just via state) because this can run in a
    // child's mount effect (see CheckoutSuccessClient) that fires before
    // CartProvider's own localStorage-hydration effect above — without this,
    // that later hydration read would reload the pre-clear cart from storage
    // and clobber the clear.
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: [] }));
  }

  // Enforces each item's own free-sauce cap right at the source, rather than
  // relying on the UI to disable buttons — a sauce pick can never exceed
  // that box's allotment, no matter how it's called.
  function setItemSauceCount(id: string, sauceName: string, count: number) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const allotment = itemSauceAllotment(item);
        const currentSauces = item.sauces ?? {};
        const otherFlavorsTotal = Object.entries(currentSauces)
          .filter(([flavor]) => flavor !== sauceName)
          .reduce((sum, [, c]) => sum + c, 0);
        const clamped = Math.max(
          0,
          Math.min(count, allotment - otherFlavorsTotal),
        );
        return { ...item, sauces: { ...currentSauces, [sauceName]: clamped } };
      }),
    );
  }

  const totalCents = items.reduce(
    (sum, i) => sum + i.unitPriceCents * i.quantity,
    0,
  );
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);

  // Empanada count only comes from items with a flavor breakdown (individual
  // empanadas and combos both carry `flavors`; other menu items don't).
  const totalEmpanadaCount = items.reduce(
    (sum, i) => sum + itemEmpanadaCount(i),
    0,
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        setItemSauceCount,
        clearCart,
        totalCents,
        totalCount,
        totalEmpanadaCount,
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
