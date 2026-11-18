import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { productsByTag, type CategorySlug } from "@/data/catalog";
import { useProductsMaybe } from "@/lib/products";
import { cn } from "@/lib/utils";
import { ProductCarousel } from "./ProductCarousel";
import { SectionTitle } from "./SectionTitle";

const tabs: { label: string; slug: CategorySlug | "todos" }[] = [
  { label: "Todos", slug: "todos" },
  { label: "Smartphones", slug: "smartphones" },
  { label: "Áudio", slug: "audio" },
  { label: "Notebooks", slug: "notebooks" },
  { label: "Games", slug: "games" },
  { label: "Periféricos", slug: "perifericos" },
];

export function BestSellers() {
  const [active, setActive] = useState<(typeof tabs)[number]["slug"]>("todos");
  const all = productsByTag(useProductsMaybe() ?? [], "mais-vendido");
  const list = active === "todos" ? all : all.filter((p) => p.category === active);

  return (
    <section className="container-store">
      <SectionTitle eyebrow="Escolha dos clientes" title="Os mais vendidos" />
      <div role="tablist" className="scrollbar-none -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:justify-center">
        {tabs.map((t) => (
          <button
            key={t.slug}
            role="tab"
            aria-selected={active === t.slug}
            onClick={() => setActive(t.slug)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition",
              active === t.slug
                ? "border-gold bg-gold-gradient text-primary-foreground"
                : "border-border bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <ProductCarousel key={active} products={list} />
      {active !== "todos" && (
        <div className="mt-4 flex justify-center">
          <Button asChild variant="outline-gold" className="rounded-full">
            <Link to="/categoria/$slug" params={{ slug: active }}>Ver todos</Link>
          </Button>
        </div>
      )}
    </section>
  );
}
