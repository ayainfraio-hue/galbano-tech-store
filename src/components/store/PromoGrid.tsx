import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import headphone from "@/assets/products/headphone.jpg";
import smartwatch from "@/assets/products/smartwatch.jpg";
import type { CategorySlug } from "@/data/catalog";

type Tile = { title: string; kicker: string; image: string; slug: CategorySlug | "ofertas" };

const tiles: Tile[] = [
  { kicker: "Preços especiais", title: "Ofertas exclusivas", image: headphone, slug: "ofertas" },
  { kicker: "Acabou de chegar", title: "Lançamentos", image: smartwatch, slug: "smartwatches" },
];

export function PromoGrid() {
  return (
    <section className="container-store space-y-4">
      <div>
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Gálbano Tech</span>
        <h2 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">
          Praticidade &amp; <span className="text-gold-gradient">melhor preço</span>
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {tiles.map((tile) => (
          <Link
            key={tile.title}
            to="/categoria/$slug"
            params={{ slug: tile.slug }}
            className="group relative flex min-h-[190px] items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card p-5 transition hover:border-gold/60 sm:min-h-[220px] sm:p-6"
          >
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{tile.kicker}</span>
              <h3 className="mt-1 text-xl font-bold sm:text-2xl">{tile.title}</h3>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground transition group-hover:text-gold">
                Confira <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
            <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface p-2 sm:h-36 sm:w-36">
              <img src={tile.image} alt="" loading="lazy" className="h-full w-full object-contain transition duration-500 group-hover:scale-110" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
