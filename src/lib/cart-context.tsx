"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import type { CartLine } from "./types";

type CartContextType = {
  lines: CartLine[];
  addToCart: (line: Omit<CartLine, "qty">, qty: number) => void;
  updateQty: (productId: string, qty: number) => void;
  removeLine: (productId: string) => void;
  clearCart: () => void;
  totalItems: number;
};

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = "shop_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // One-time hydration from localStorage on mount (external system read,
    // not a derived-state update) - safe to set state directly here.
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, loaded]);

  function addToCart(line: Omit<CartLine, "qty">, qty: number) {
    setLines((prev) => {
      const existing = prev.find((l) => l.product_id === line.product_id);
      if (existing) {
        return prev.map((l) =>
          l.product_id === line.product_id ? { ...l, qty: l.qty + qty } : l
        );
      }
      return [...prev, { ...line, qty }];
    });
  }

  function updateQty(productId: string, qty: number) {
    setLines((prev) => {
      if (qty <= 0) return prev.filter((l) => l.product_id !== productId);
      return prev.map((l) =>
        l.product_id === productId ? { ...l, qty } : l
      );
    });
  }

  function removeLine(productId: string) {
    setLines((prev) => prev.filter((l) => l.product_id !== productId));
  }

  function clearCart() {
    setLines([]);
  }

  const totalItems = lines.reduce((sum, l) => sum + l.qty, 0);

  return (
    <CartContext.Provider
      value={{ lines, addToCart, updateQty, removeLine, clearCart, totalItems }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
