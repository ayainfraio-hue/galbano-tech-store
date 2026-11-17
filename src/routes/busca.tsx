import { Link, createFileRoute } from "@tanstack/react-router";
import { SearchX } from "lucide-react";
import { z } from "zod";

import { ProductGrid } from "@/components/store/ProductGrid";
import { Button } from "@/components/ui/button";
import { searchProducts } from "@/data/catalog";
import { useProducts } from "@/lib/products";

export const Route = createFileRoute("/busca")({
  validateSearch: z.object({ q: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Buscar produtos — Gálbano Tech" },
      { name: "description", content: "Encontre smartphones, notebooks, áudio, games e mais na Gálbano Tech." },
      { property: "og:title", content: "Buscar produtos — Gálbano Tech" },
      { property: "og:description", content: "Encontre tecnologia e eletrônicos na Gálbano Tech." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const products = useProducts();
  const results = searchProducts(products, q ?? "");

  return (
    <div className="container-store pt-8">
      <h1 className="text-2xl font-bold sm:text-3xl">
        {q ? (
          <>
            Resultados para <span className="text-gold-gradient">“{q}”</span>
          </>
        ) : (
          "Todos os produtos"
        )}
      </h1>
      <div className="mt-6">
        {results.length > 0 ? (
          <ProductGrid key={q} products={results} />
        ) : (
          <div className="flex flex-col items-center rounded-3xl border border-border bg-card px-6 py-16 text-center">
            <SearchX className="h-12 w-12 text-gold" />
            <h2 className="mt-4 text-xl font-bold">Nenhum produto encontrado</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Tente outro termo ou fale com a gente no WhatsApp para encontrar o produto ideal.
            </p>
            <Button asChild variant="gold" className="mt-6 rounded-full">
              <Link to="/categoria/$slug" params={{ slug: "ofertas" }}>Ver ofertas</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
