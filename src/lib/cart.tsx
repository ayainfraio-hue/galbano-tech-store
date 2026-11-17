import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { getProduct, type Product } from "@/data/catalog";
import { useProductsMaybe } from "./products";
import { orderTotals, type OrderLine } from "./whatsapp";

const STORAGE_KEY = "galbano-cart-v1";

interface CartEntry {
  slug: string;
  quantity: number;
}

export interface CartLine extends OrderLine {
  product: Product;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  total: number;
  ready: boolean;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  add: (slug: string, quantity?: number) => void;
  setQuantity: (slug: string, quantity: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const products = useProductsMaybe();
  const [entries, setEntries] = useState<CartEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartEntry[];
        if (Array.isArray(parsed)) setEntries(parsed.filter((e) => typeof e?.slug === "string" && e.quantity > 0));
      }
    } catch {
      // carrinho corrompido: começa vazio
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries, ready]);

  const add = useCallback((slug: string, quantity = 1) => {
    setEntries((prev) => {
      const found = prev.find((e) => e.slug === slug);
      if (found) return prev.map((e) => (e.slug === slug ? { ...e, quantity: Math.min(99, e.quantity + quantity) } : e));
      return [...prev, { slug, quantity }];
    });
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    setEntries((prev) =>
      quantity <= 0
        ? prev.filter((e) => e.slug !== slug)
        : prev.map((e) => (e.slug === slug ? { ...e, quantity: Math.min(99, quantity) } : e)),
    );
  }, []);

  const remove = useCallback((slug: string) => setEntries((prev) => prev.filter((e) => e.slug !== slug)), []);
  const clear = useCallback(() => setEntries([]), []);

  const value = useMemo<CartContextValue>(() => {
    const list = products ?? [];
    // Produtos removidos do catálogo somem do carrinho automaticamente.
    const lines: CartLine[] = entries.flatMap((e) => {
      const product = getProduct(list, e.slug);
      return product
        ? [{ product, name: product.name, sku: product.sku, price: product.price, quantity: e.quantity }]
        : [];
    });
    const { total, items } = orderTotals(lines);
    return {
      lines,
      count: items,
      total,
      ready: ready && !!products,
      isOpen,
      setOpen,
      add,
      setQuantity,
      remove,
      clear,
    };
  }, [entries, products, ready, isOpen, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
