import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";

import type { Product } from "@/data/catalog";
import { useCart } from "@/lib/cart";
import { discountPercent, formatBRL } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function useAddToCart() {
  const { add } = useCart();
  const navigate = useNavigate();
  return (product: Product, quantity = 1) => {
    add(product.slug, quantity);
    toast.success("Produto adicionado ao carrinho", {
      description: product.name,
      action: { label: "Ver carrinho", onClick: () => navigate({ to: "/carrinho" }) },
    });
  };
}

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const addToCart = useAddToCart();
  const off = discountPercent(product.price, product.oldPrice);

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border border-surface-border bg-surface text-surface-foreground shadow-card transition duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-gold",
        className,
      )}
    >
      <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
        {off > 0 && (
          <span className="rounded-md bg-ink px-2 py-0.5 text-[11px] font-bold text-gold">-{off}%</span>
        )}
        {product.badge && !product.badge.startsWith("-") && (
          <span className="rounded-md bg-gold-gradient px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
            {product.badge}
          </span>
        )}
      </div>

      <Link to="/produto/$slug" params={{ slug: product.slug }} className="block">
        <div className="aspect-square overflow-hidden p-4">
          <img
            src={product.image}
            alt={product.name}
            width={816}
            height={816}
            loading="lazy"
            className="h-full w-full object-contain mix-blend-multiply transition duration-500 group-hover:scale-105"
          />
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 px-4 pb-4">
        <div className="flex items-center justify-between text-[11px] text-surface-muted-foreground">
          <span className="font-semibold uppercase tracking-wider">{product.brand}</span>
          <span className="flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-gold text-gold" /> {product.rating.toFixed(1)}
          </span>
        </div>
        <Link to="/produto/$slug" params={{ slug: product.slug }}>
          <h3 className="line-clamp-2 min-h-[2.5rem] font-sans text-sm font-medium leading-snug hover:underline">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto pt-1">
          <p className="h-4 text-xs text-surface-muted-foreground line-through">
            {product.oldPrice ? formatBRL(product.oldPrice) : ""}
          </p>
          <div className="mt-0.5 flex items-end justify-between gap-2">
            <p className="font-display text-xl font-bold tracking-tight">{formatBRL(product.price)}</p>
            <button
              type="button"
              onClick={() => addToCart(product)}
              aria-label={`Adicionar ${product.name} ao carrinho`}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-gold transition hover:bg-gold-gradient hover:text-primary-foreground"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
