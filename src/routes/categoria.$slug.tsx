import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { ProductGrid } from "@/components/store/ProductGrid";
import { Button } from "@/components/ui/button";
import { getCategory, productsByCategory, productsByTag } from "@/data/catalog";
import { useStoreCategories } from "@/lib/store-content";
import { useProducts } from "@/lib/products";

function resolve(slug: string) {
  if (slug === "ofertas") {
    return {
      title: "Ofertas",
      description: "As melhores ofertas de tecnologia da Gálbano Tech, com descontos por tempo limitado.",
    };
  }
  const category = getCategory(slug);
  const title = category?.name ?? slug.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  return {
    title,
    description: `${title} com preços especiais na Gálbano Tech. Monte seu carrinho e finalize pelo WhatsApp.`,
  };
}

export const Route = createFileRoute("/categoria/$slug")({
  loader: ({ params }) => {
    const info = resolve(params.slug);
    if (!info) throw notFound();
    return info;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Categoria indisponível — Gálbano Tech" }, { name: "robots", content: "noindex" }] };
    const title = `${loaderData.title} — Gálbano Tech`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.description },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="container-store py-24 text-center">
      <h1 className="text-2xl font-bold">Categoria não encontrada</h1>
      <Button asChild variant="gold" className="mt-6 rounded-full">
        <Link to="/">Voltar para a loja</Link>
      </Button>
    </div>
  ),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const info = Route.useLoaderData();
  const products = useProducts();
  const categoryQuery = useStoreCategories();
  const dynamicCategory = categoryQuery.data?.find((category) => category.slug === slug);
  const title = dynamicCategory?.name ?? info.title;
  const list = slug === "ofertas" ? productsByTag(products, "oferta") : productsByCategory(products, slug);

  return (
    <div className="container-store pt-6">
      <nav aria-label="Navegação" className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-gold">Início</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{title}</span>
      </nav>

      <div className="mt-5 overflow-hidden rounded-3xl border border-gold/30 bg-panel px-6 py-8 sm:px-10 sm:py-10">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Gálbano Tech</span>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">{info.description}</p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-gold">Departamentos</h2>
          <ul className="space-y-1 text-sm">
            <li>
              <Link
                to="/categoria/$slug"
                params={{ slug: "ofertas" }}
                className="block rounded-lg px-3 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-gold font-semibold" }}
              >
                Ofertas
              </Link>
            </li>
            {(categoryQuery.data ?? []).map((c) => (
              <li key={c.slug}>
                <Link
                  to="/categoria/$slug"
                  params={{ slug: c.slug }}
                  className="block rounded-lg px-3 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  activeProps={{ className: "bg-secondary text-gold font-semibold" }}
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
        <ProductGrid key={slug} products={list} />
      </div>
    </div>
  );
}
