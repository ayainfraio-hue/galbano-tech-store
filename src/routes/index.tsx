import { createFileRoute } from "@tanstack/react-router";

import heroGamer from "@/assets/hero-gamer.jpg";
import { AboutFaq } from "@/components/store/AboutFaq";
import { BenefitsBar } from "@/components/store/BenefitsBar";
import { BestSellers } from "@/components/store/BestSellers";
import { BrandsRow } from "@/components/store/BrandsRow";
import { CustomerGallery } from "@/components/store/CustomerGallery";
import { CategoryStrip } from "@/components/store/CategoryStrip";
import { HeroCarousel } from "@/components/store/HeroCarousel";
import { ProductCarousel } from "@/components/store/ProductCarousel";
import { PromoGrid } from "@/components/store/PromoGrid";
import { SectionTitle } from "@/components/store/SectionTitle";
import { ShowcaseWithBanner } from "@/components/store/ShowcaseWithBanner";
import { productsByTag } from "@/data/catalog";
import { useProducts } from "@/lib/products";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gálbano Tech — Tecnologia premium com ofertas exclusivas" },
      {
        name: "description",
        content:
          "Smartphones, notebooks, smart TVs, games e acessórios com preços especiais. Monte seu carrinho e finalize pelo WhatsApp.",
      },
      { property: "og:title", content: "Gálbano Tech — Tecnologia premium com ofertas exclusivas" },
      {
        property: "og:description",
        content: "Smartphones, notebooks, smart TVs, games e acessórios. Finalize seu pedido pelo WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const products = useProducts();
  const offers = productsByTag(products, "oferta")
    .slice()
    .sort((a, b) => (b.oldPrice ?? b.price) - b.price - ((a.oldPrice ?? a.price) - a.price));
  const gamer = products.filter((p) => p.category === "games" || p.category === "perifericos");
  const featured = productsByTag(products, "destaque");
  const launches = productsByTag(products, "lancamento");

  return (
    <div className="space-y-14 pb-6 sm:space-y-20">
      <HeroCarousel />
      <CategoryStrip />

      <section className="container-store">
        <SectionTitle eyebrow="Black November" title="Melhores ofertas" />
        <ProductCarousel products={offers} />
      </section>

      <PromoGrid />
      <BenefitsBar />

      <ShowcaseWithBanner
        eyebrow="Performance"
        title="Mundo gamer"
        image={heroGamer}
        bannerTitle="Setup completo"
        bannerText="Consoles, monitores, teclados e mouses."
        slug="games"
        products={gamer}
      />

      <section className="container-store">
        <SectionTitle eyebrow="Seleção Gálbano" title="Produtos em destaque" />
        <ProductCarousel products={featured} />
      </section>

      <BestSellers />

      <section className="container-store">
        <SectionTitle eyebrow="Novidades" title="Lançamentos" />
        <ProductCarousel products={launches} />
      </section>

      <BrandsRow />
      <AboutFaq />
    </div>
  );
}
