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
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: StoredCart = JSON.parse(raw);
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
  const freeSauceAllotment = Math.floor(totalEmpanadaCount / 3);

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
        sauces,
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
