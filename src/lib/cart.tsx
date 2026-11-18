import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { getProduct, type Product } from "@/data/catalog";
import { useProductsMaybe } from "./products";
import { orderTotals, type OrderLine } from "./whatsapp";

const STORAGE_KEY = "galbano-cart-v1";

interface CartEntry {
  slug: string;
  quantity: number;
  options?: Record<string, string>;
}

function cartEntryKey(entry: Pick<CartEntry, "slug" | "options">) {
  return `${entry.slug}::${JSON.stringify(Object.entries(entry.options ?? {}).sort(([a], [b]) => a.localeCompare(b)))}`;
}

export interface CartLine extends OrderLine {
  product: Product;
  cartKey: string;
  variantLabel: string;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  total: number;
  ready: boolean;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  add: (slug: string, quantity?: number, options?: Record<string, string>) => void;
  setQuantity: (cartKey: string, quantity: number) => void;
  remove: (cartKey: string) => void;
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
        if (Array.isArray(parsed)) setEntries(parsed.filter((e) => typeof e?.slug === "string" && e.quantity > 0).map((e) => ({ ...e, options: e.options ?? {} })));
      }
    } catch {
      // carrinho corrompido: começa vazio
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries, ready]);

  // Revalida o carrinho salvo quando o catálogo/estoque é carregado ou atualizado.
  useEffect(() => {
    if (!products) return;
    setEntries((prev) =>
      prev.flatMap((entry) => {
        const product = getProduct(products, entry.slug);
        if (!product || product.stock <= 0) return [];
        const quantity = Math.min(entry.quantity, product.stock);
        return [{ ...entry, quantity }];
      }),
    );
  }, [products]);

  const add = useCallback((slug: string, quantity = 1, options: Record<string, string> = {}) => {
    const product = getProduct(products ?? [], slug);
    if (!product || product.stock <= 0) {
      toast.error("Produto sem estoque disponível.");
      return;
    }
    const key = cartEntryKey({ slug, options });
    const current = entries.find((entry) => cartEntryKey(entry) === key)?.quantity ?? 0;
    if (current + quantity > product.stock) {
      toast.error(`Estoque disponível: apenas ${product.stock} unidade(s).`);
    }
    setEntries((prev) => {
      const found = prev.find((e) => cartEntryKey(e) === key);
      const next = Math.min(product.stock, current + quantity);
      if (found) return prev.map((e) => (cartEntryKey(e) === key ? { ...e, quantity: next } : e));
      return [...prev, { slug, options, quantity: Math.min(product.stock, quantity) }];
    });
  }, [products, entries]);

  const setQuantity = useCallback((key: string, quantity: number) => {
    if (quantity <= 0) {
      setEntries((prev) => prev.filter((e) => cartEntryKey(e) !== key));
      return;
    }
    const product = getProduct(products ?? [], slug);
    const safeQuantity = product ? Math.min(quantity, product.stock) : quantity;
    if (product && quantity > product.stock) {
      toast.error(`Estoque disponível para este produto: ${product.stock} unidade(s).`);
    }
    setEntries((prev) =>
      safeQuantity <= 0
        ? prev.filter((e) => cartEntryKey(e) !== key)
        : prev.map((e) => (cartEntryKey(e) === key ? { ...e, quantity: safeQuantity } : e)),
    );
  }, [products]);

  const remove = useCallback((key: string) => setEntries((prev) => prev.filter((e) => cartEntryKey(e) !== key)), []);
  const clear = useCallback(() => setEntries([]), []);

  const value = useMemo<CartContextValue>(() => {
    const list = products ?? [];
    const lines: CartLine[] = entries.flatMap((e) => {
      const product = getProduct(list, e.slug);
      if (!product || product.stock <= 0) return [];
      const quantity = Math.min(e.quantity, product.stock);
      return [{ product, name: product.name, sku: product.sku, price: product.price, quantity, options: e.options ?? {}, cartKey: cartEntryKey(e), variantLabel: Object.entries(e.options ?? {}).map(([key, value]) => `${key}: ${value}`).join(" · ") }];
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
