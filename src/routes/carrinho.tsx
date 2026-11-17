import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ShoppingBag, Trash2 } from "lucide-react";

import { CheckoutDialog } from "@/components/store/CheckoutDialog";
import { ProductCarousel } from "@/components/store/ProductCarousel";
import { QuantityStepper } from "@/components/store/QuantityStepper";
import { SectionTitle } from "@/components/store/SectionTitle";
import { WhatsAppIcon } from "@/components/store/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { productsByTag } from "@/data/catalog";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/pricing";
import { useProducts } from "@/lib/products";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Meu carrinho — Gálbano Tech" },
      { name: "description", content: "Revise seus produtos e finalize o pedido pelo WhatsApp da Gálbano Tech." },
      { property: "og:title", content: "Meu carrinho — Gálbano Tech" },
      { property: "og:description", content: "Revise seus produtos e finalize o pedido pelo WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, count, total, ready, setQuantity, remove, clear } = useCart();
  const products = useProducts();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <div className="container-store pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Meu carrinho</h1>
          {ready && count > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {count} {count === 1 ? "item" : "itens"} no carrinho
            </p>
          )}
        </div>
        <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-gold">
          <ArrowLeft className="h-4 w-4" /> Continuar comprando
        </Link>
      </div>

      {!ready ? (
        <div className="mt-8 h-64 animate-pulse rounded-3xl bg-card" />
      ) : lines.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-3xl border border-border bg-panel px-6 py-16 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-gold/10 ring-1 ring-gold/40">
            <ShoppingBag className="h-9 w-9 text-gold" />
          </span>
          <h2 className="mt-5 text-xl font-bold">Seu carrinho está vazio</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Explore nossas ofertas e adicione os produtos que você deseja.
          </p>
          <Button asChild variant="gold" size="xl" className="mt-6 rounded-full">
            <Link to="/categoria/$slug" params={{ slug: "ofertas" }}>Ver ofertas</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <ul className="space-y-3">
            {lines.map((line) => (
              <li
                key={line.product.slug}
                className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 rounded-2xl border border-border bg-card p-3 sm:grid-cols-[110px_minmax(0,1fr)_auto] sm:items-center sm:p-4"
              >
                <Link to="/produto/$slug" params={{ slug: line.product.slug }} className="block self-start overflow-hidden rounded-xl bg-surface p-2">
                  <img src={line.product.image} alt={line.product.name} className="aspect-square w-full object-contain mix-blend-multiply" loading="lazy" />
                </Link>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gold">{line.product.brand}</p>
                  <Link to="/produto/$slug" params={{ slug: line.product.slug }}>
                    <h2 className="line-clamp-2 font-sans text-sm font-medium hover:underline">{line.product.name}</h2>
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">Cód. {line.sku} · {formatBRL(line.price)} / un.</p>
                  <div className="mt-3 flex items-center gap-3 sm:hidden">
                    <QuantityStepper value={line.quantity} onChange={(v) => setQuantity(line.product.slug, v)} />
                    <button
                      type="button"
                      onClick={() => remove(line.product.slug)}
                      aria-label={`Remover ${line.product.name}`}
                      className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-2 font-display text-lg font-bold sm:hidden">{formatBRL(line.price * line.quantity)}</p>
                </div>
                <div className="hidden items-center gap-5 sm:flex">
                  <QuantityStepper value={line.quantity} onChange={(v) => setQuantity(line.product.slug, v)} />
                  <p className="w-32 text-right font-display text-lg font-bold">{formatBRL(line.price * line.quantity)}</p>
                  <button
                    type="button"
                    onClick={() => remove(line.product.slug)}
                    aria-label={`Remover ${line.product.name}`}
                    className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
            <li className="flex justify-end">
              <button type="button" onClick={clear} className="text-xs font-medium text-muted-foreground hover:text-destructive">
                Esvaziar carrinho
              </button>
            </li>
          </ul>

          <aside className="h-fit rounded-3xl border border-gold/30 bg-panel p-6 lg:sticky lg:top-44">
            <h2 className="text-lg font-bold">Resumo do pedido</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Produtos ({count})</dt>
                <dd>{formatBRL(total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Frete</dt>
                <dd className="text-muted-foreground">Combinado no WhatsApp</dd>
              </div>
              <div className="gold-divider" />
              <div className="flex items-end justify-between">
                <dt className="font-semibold">Total</dt>
                <dd className="font-display text-3xl font-extrabold text-gold-gradient">{formatBRL(total)}</dd>
              </div>
            </dl>
            <Button variant="whatsapp" size="xl" className="mt-6 w-full rounded-full" onClick={() => setCheckoutOpen(true)}>
              <WhatsAppIcon className="h-5 w-5" /> Finalizar pedido pelo WhatsApp
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Informe nome e telefone, registramos o pedido e abrimos o WhatsApp comercial com o resumo completo.
              Pagamento e entrega são combinados com o vendedor.
            </p>
          </aside>
        </div>
      )}

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        items={lines.map((l) => ({ slug: l.product.slug, name: l.name, sku: l.sku, price: l.price, quantity: l.quantity }))}
        onOrderCreated={clear}
      />

      <section className="mt-16">
        <SectionTitle eyebrow="Aproveite" title="Ofertas para você" />
        <ProductCarousel products={productsByTag(products, "oferta")} />
      </section>
    </div>
  );
}
