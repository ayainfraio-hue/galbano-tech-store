import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import type { CategorySlug, Product } from "@/data/catalog";
import { ProductCarousel } from "./ProductCarousel";
import { SectionTitle } from "./SectionTitle";

export function ShowcaseWithBanner({
  title,
  eyebrow,
  image,
  bannerTitle,
  bannerText,
  slug,
  products,
}: {
  title: string;
  eyebrow?: string | undefined;
  image: string;
  bannerTitle: string;
  bannerText: string;
  slug: CategorySlug;
  products: Product[];
}) {
  return (
    <section className="container-store">
      <SectionTitle eyebrow={eyebrow} title={title} />
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Link
          to="/categoria/$slug"
          params={{ slug }}
          className="group relative flex min-h-[220px] overflow-hidden rounded-2xl border border-gold/30"
        >
          <img src={image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover object-[75%_center] transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
          <div className="relative mt-auto p-6">
            <h3 className="text-2xl font-extrabold leading-tight">{bannerTitle}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{bannerText}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gold">
              Ver todos <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>
        <ProductCarousel products={products} className="min-w-0" slideClassName="basis-[62%] sm:basis-1/3 xl:basis-1/4" />
      </div>
    </section>
  );
}
