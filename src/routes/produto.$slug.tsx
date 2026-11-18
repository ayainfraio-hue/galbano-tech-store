import { Link, createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, ChevronRight, ShieldCheck, ShoppingCart, Star, Truck } from "lucide-react";
import { useState } from "react";

import { useAddToCart } from "@/components/store/ProductCard";
import { ProductCarousel } from "@/components/store/ProductCarousel";
import { QuantityStepper } from "@/components/store/QuantityStepper";
import { SectionTitle } from "@/components/store/SectionTitle";
import { WhatsAppIcon } from "@/components/store/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductDescription } from "@/components/store/ProductDescription";
import { CheckoutDialog } from "@/components/store/CheckoutDialog";
import { getCategory, getProduct } from "@/data/catalog";
import { productsQueryOptions, useProducts } from "@/lib/products";
import { discountPercent, formatBRL } from "@/lib/pricing";

export const Route = createFileRoute("/produto/$slug")({
  loader: async ({ params, context }) => {
    const products = await context.queryClient.ensureQueryData(productsQueryOptions);
    const product = getProduct(products, params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Produto indisponível — Gálbano Tech" }, { name: "robots", content: "noindex" }] };
    const { product } = loaderData;
    const title = `${product.name} — Gálbano Tech`;
    return {
      meta: [
        { title },
        { name: "description", content: product.short },
        { property: "og:title", content: title },
        { property: "og:description", content: product.short },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="container-store py-24 text-center">
      <h1 className="text-2xl font-bold">Produto não encontrado</h1>
      <p className="mt-2 text-muted-foreground">Este produto não está mais disponível.</p>
      <Button asChild variant="gold" className="mt-6 rounded-full">
        <Link to="/">Voltar para a loja</Link>
      </Button>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { product: loaded } = Route.useLoaderData();
  const products = useProducts();
  const product = getProduct(products, loaded.slug) ?? loaded;
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(product.image);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const optionsComplete = product.variants.every((variant) => !!selectedOptions[variant.name]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const addToCart = useAddToCart();
  const navigate = useNavigate();
  const category = getCategory(product.category);
  const off = discountPercent(product.price, product.oldPrice);
  const related = products.filter((p) => p.category === product.category && p.slug !== product.slug);
  const more = related.length >= 4 ? related : [...related, ...products.filter((p) => p.category !== product.category && p.tags.includes("destaque"))].slice(0, 10);


  return (
    <div className="container-store pt-6">
      <nav aria-label="Navegação" className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-gold">Início</Link>
        <ChevronRight className="h-3 w-3" />
        {category && (
          <>
            <Link to="/categoria/$slug" params={{ slug: category.slug }} className="hover:text-gold">
              {category.name}
            </Link>
            <ChevronRight className="h-3 w-3" />
          </>
        )}
        <span className="line-clamp-1 text-foreground">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <div>
          <div className="relative overflow-hidden rounded-3xl border border-surface-border bg-surface p-6 sm:p-10">
            {off > 0 && <span className="absolute left-5 top-5 z-10 rounded-md bg-ink px-2.5 py-1 text-xs font-bold text-gold">-{off}% OFF</span>}
            <img src={activeImage} alt={product.name} width={816} height={816} className="mx-auto aspect-square w-full max-w-lg object-contain mix-blend-multiply" />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {product.images.map((image, index) => (
                <button key={image} type="button" onClick={() => setActiveImage(image)} aria-label={`Ver foto ${index + 1}`} aria-pressed={activeImage === image} className={`h-16 w-16 overflow-hidden rounded-xl border bg-surface p-1 ${activeImage === image ? "border-gold ring-2 ring-gold/30" : "border-border"}`}>
                  <img src={image} alt="" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-gold/40 px-2.5 py-1 font-semibold uppercase tracking-wider text-gold">
              {product.brand}
            </span>
            {product.badge && !product.badge.startsWith("-") && (
              <span className="rounded-full bg-gold-gradient px-2.5 py-1 font-bold uppercase tracking-wide text-primary-foreground">
                {product.badge}
              </span>
            )}
            <span className="text-muted-foreground">Cód. {product.sku}</span>
          </div>

          <h1 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">{product.name.replace(/\\*/g, "").trim()}</h1>

          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={i < Math.round(product.rating) ? "h-4 w-4 fill-gold text-gold" : "h-4 w-4 text-muted-foreground"} />
              ))}
            </span>
            <span className="font-semibold">{product.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({product.reviews} avaliações)</span>
          </div>

          <p className="mt-4 text-muted-foreground">{product.short}</p>

          <div className="mt-6 rounded-2xl border border-border bg-panel p-5 sm:p-6">
            {product.oldPrice && (
              <p className="text-sm text-muted-foreground">
                de <span className="line-through">{formatBRL(product.oldPrice)}</span> por
              </p>
            )}
            <p className="font-display text-4xl font-extrabold text-gold-gradient sm:text-5xl">{formatBRL(product.price)}</p>
            {off > 0 && product.oldPrice && (
              <p className="mt-1 text-sm font-medium text-gold">
                Você economiza {formatBRL(product.oldPrice - product.price)}
              </p>
            )}

            {product.variants.length > 0 && (
              <div className="mt-5 space-y-3">
                {product.variants.map((variant) => (
                  <div key={variant.name} className="space-y-1.5">
                    <label className="text-sm font-semibold">{variant.name}</label>
                    <Select value={selectedOptions[variant.name] ?? ""} onValueChange={(value) => setSelectedOptions((current) => ({ ...current, [variant.name]: value }))}>
                      <SelectTrigger><SelectValue placeholder={`Escolha ${variant.name.toLowerCase()}`} /></SelectTrigger>
                      <SelectContent>{variant.options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
            {product.variants.length > 0 && !optionsComplete && <p className="mt-3 text-xs text-muted-foreground">Selecione as opções para continuar.</p>}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <QuantityStepper value={qty} onChange={setQty} className="w-full justify-between sm:w-auto" />
              <Button
                variant="gold"
                size="xl"
                className="w-full rounded-full sm:w-auto sm:flex-1"
                disabled={!optionsComplete}
                onClick={() => addToCart(product, qty, selectedOptions)}
              >
                <ShoppingCart /> Adicionar ao carrinho
              </Button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Button variant="whatsapp" size="xl" className="rounded-full" onClick={() => setCheckoutOpen(true)} disabled={!optionsComplete}>
                <WhatsAppIcon className="h-5 w-5" /> Comprar pelo WhatsApp
              </Button>
              <Button
                variant="outline-gold"
                size="xl"
                className="rounded-full"
                disabled={!optionsComplete}
                onClick={() => {
                  addToCart(product, qty, selectedOptions);
                  navigate({ to: "/carrinho" });
                }}
              >
                Ir para o carrinho
              </Button>
            </div>
          </div>

          <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
            {[
              { icon: Truck, text: "Entrega para todo o Brasil" },
              { icon: BadgeCheck, text: "Produto original e lacrado" },
              { icon: ShieldCheck, text: "Garantia do fabricante" },
            ].map((b) => (
              <li key={b.text} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
                <b.icon className="h-5 w-5 shrink-0 text-gold" />
                <span className="text-muted-foreground">{b.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Tabs defaultValue="descricao" className="mt-12">
        <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto rounded-full bg-secondary p-1 sm:w-auto">
          <TabsTrigger value="descricao" className="rounded-full px-5 py-2 data-[state=active]:bg-gold-gradient data-[state=active]:text-primary-foreground">
            Descrição
          </TabsTrigger>
          <TabsTrigger value="especificacoes" className="rounded-full px-5 py-2 data-[state=active]:bg-gold-gradient data-[state=active]:text-primary-foreground">
            Especificações
          </TabsTrigger>
        </TabsList>
        <TabsContent value="descricao" className="mt-6 max-w-3xl leading-relaxed text-muted-foreground">
          <ProductDescription text={product.description} />
        </TabsContent>
        <TabsContent value="especificacoes" className="mt-6">
          <dl className="max-w-3xl overflow-hidden rounded-2xl border border-border">
            {product.specs.map(([k, v], i) => (
              <div key={k} className={i % 2 === 0 ? "grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-4 bg-card px-5 py-3 text-sm" : "grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-4 px-5 py-3 text-sm"}>
                <dt className="font-semibold text-foreground">{k}</dt>
                <dd className="text-muted-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </TabsContent>
      </Tabs>

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        items={[{ slug: product.slug, name: product.name, sku: product.sku, price: product.price, quantity: qty, options: selectedOptions }]}
      />

      {more.length > 0 && (
        <section className="mt-16">
          <SectionTitle eyebrow="Você também pode gostar" title="Produtos relacionados" />
          <ProductCarousel products={more} />
        </section>
      )}
    </div>
  );
}
