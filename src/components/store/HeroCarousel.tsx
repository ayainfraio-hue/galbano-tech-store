import { Link } from "@tanstack/react-router";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import heroBlack from "@/assets/hero-black-november.jpg";
import heroGamer from "@/assets/hero-gamer.jpg";
import heroTv from "@/assets/hero-smart-tv.jpg";
import { Button } from "@/components/ui/button";
import type { CategorySlug } from "@/data/catalog";
import { cn } from "@/lib/utils";
import { CarouselArrow } from "./ProductCarousel";

const slides: {
  image: string;
  eyebrow: string;
  title: string;
  highlight: string;
  text: string;
  cta: string;
  slug: CategorySlug | "ofertas";
}[] = [
  {
    image: heroBlack,
    eyebrow: "Black November",
    title: "Tecnologia premium",
    highlight: "até 30% OFF",
    text: "Smartphones, fones e smartwatches com preços especiais por tempo limitado.",
    cta: "Ver ofertas",
    slug: "ofertas",
  },
  {
    image: heroGamer,
    eyebrow: "Mundo Gamer",
    title: "Seu setup no",
    highlight: "próximo nível",
    text: "Notebooks, teclados mecânicos, mouses e monitores para jogar sem limites.",
    cta: "Montar meu setup",
    slug: "perifericos",
  },
  {
    image: heroTv,
    eyebrow: "TV e Vídeo",
    title: "Cinema em casa",
    highlight: "em 4K QLED",
    text: "Smart TVs com cores vivas, HDR10+ e som envolvente para a sua sala.",
    cta: "Conhecer TVs",
    slug: "tv-e-video",
  },
];

export function HeroCarousel() {
  const [ref, api] = useEmblaCarousel({ loop: true });
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => api && setSelected(api.selectedScrollSnap()), [api]);

  useEffect(() => {
    if (!api) return;
    api.on("select", onSelect);
    const timer = window.setInterval(() => api.scrollNext(), 6000);
    return () => {
      api.off("select", onSelect);
      window.clearInterval(timer);
    };
  }, [api, onSelect]);

  return (
    <section aria-label="Destaques" className="relative bg-ink">
      <div ref={ref} className="overflow-hidden">
        <div className="flex">
          {slides.map((s, i) => (
            <div key={s.title} className="relative min-w-0 shrink-0 grow-0 basis-full">
              <div className="relative h-[440px] sm:h-[460px] lg:h-[520px]">
                <img
                  src={s.image}
                  alt=""
                  width={1920}
                  height={720}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="absolute inset-0 h-full w-full object-cover object-[72%_center] lg:object-center"
                />
                <div className="absolute inset-0 bg-hero-fade" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
                <div className="container-store relative flex h-full flex-col justify-end pb-16 sm:justify-center sm:pb-0">
                  <div className="max-w-xl">
                    <span className="inline-flex items-center rounded-full border border-gold/50 bg-ink/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold backdrop-blur">
                      {s.eyebrow}
                    </span>
                    <h2 className="mt-4 text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
                      {s.title}
                      <span className="block text-gold-gradient">{s.highlight}</span>
                    </h2>
                    <p className="mt-4 max-w-md text-sm text-muted-foreground sm:text-base">{s.text}</p>
                    <Button asChild variant="gold" size="xl" className="mt-6 rounded-full">
                      <Link to="/categoria/$slug" params={{ slug: s.slug }}>
                        {s.cta} <ArrowRight />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container-store pointer-events-none absolute inset-x-0 bottom-14 hidden justify-end gap-2 lg:flex">
        <CarouselArrow dir="prev" onClick={() => api?.scrollPrev()} className="pointer-events-auto" />
        <CarouselArrow dir="next" onClick={() => api?.scrollNext()} className="pointer-events-auto" />
      </div>

      <div className="absolute inset-x-0 bottom-6 flex justify-center gap-2">
        {slides.map((s, i) => (
          <button
            key={s.title}
            type="button"
            aria-label={`Ir para o destaque ${i + 1}`}
            onClick={() => api?.scrollTo(i)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              selected === i ? "w-8 bg-gold" : "w-3 bg-foreground/30 hover:bg-foreground/60",
            )}
          />
        ))}
      </div>
    </section>
  );
}
