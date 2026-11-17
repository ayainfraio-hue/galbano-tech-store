import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import consoleImg from "@/assets/products/console.jpg";
import drone from "@/assets/products/drone.jpg";
import headphone from "@/assets/products/headphone.jpg";
import smartTv from "@/assets/products/smart-tv.jpg";
import smartwatch from "@/assets/products/smartwatch.jpg";
import type { CategorySlug } from "@/data/catalog";

type Tile = { title: string; kicker: string; image: string; slug: CategorySlug | "ofertas" };

const tiles: Tile[] = [
  { kicker: "Preços especiais", title: "Ofertas exclusivas", image: headphone, slug: "ofertas" },
  { kicker: "Acabou de chegar", title: "Lançamentos", image: smartwatch, slug: "smartwatches" },
  { kicker: "Jogue em 4K", title: "Mundo gamer", image: consoleImg, slug: "games" },
  { kicker: "Voe mais alto", title: "Drones 4K", image: drone, slug: "drones" },
];

export function PromoGrid() {
  return (
    <section className="container-store grid gap-4 lg:grid-cols-[1.05fr_2fr]">
      <Link
        to="/categoria/$slug"
        params={{ slug: "tv-e-video" }}
        className="group relative flex min-h-[320px] flex-col justify-between overflow-hidden rounded-2xl border border-gold/30 bg-panel p-6 sm:p-8"
      >
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Gálbano Tech</span>
          <h3 className="mt-2 text-3xl font-extrabold leading-tight">
            Praticidade &<span className="block text-gold-gradient">melhor preço</span>
          </h3>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">Smart TVs 4K com as melhores condições da temporada.</p>
        </div>
        <div className="relative mt-6 overflow-hidden rounded-xl bg-surface p-4">
          <img src={smartTv} alt="Smart TV 4K" loading="lazy" className="mx-auto h-44 w-auto object-contain transition duration-500 group-hover:scale-105" />
        </div>
      </Link>

      <div className="grid gap-4 sm:grid-cols-2">
        {tiles.map((t) => (
          <Link
            key={t.title}
            to="/categoria/$slug"
            params={{ slug: t.slug }}
            className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card p-5 transition hover:border-gold/60"
          >
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{t.kicker}</span>
              <h3 className="mt-1 text-xl font-bold sm:text-2xl">{t.title}</h3>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground transition group-hover:text-gold">
                Confira <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
            <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface p-2 sm:h-32 sm:w-32">
              <img src={t.image} alt="" loading="lazy" className="h-full w-full object-contain transition duration-500 group-hover:scale-110" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
