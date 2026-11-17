import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type { Product } from "@/data/catalog";
import { cn } from "@/lib/utils";
import { ProductCard } from "./ProductCard";

export function CarouselArrow({
  dir,
  onClick,
  disabled,
  className,
}: {
  dir: "prev" | "next";
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Anterior" : "Próximo"}
      className={cn(
        "grid h-10 w-10 place-items-center rounded-full border border-gold/50 bg-ink/90 text-gold shadow-card transition hover:bg-gold hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-0",
        className,
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

export function ProductCarousel({
  products,
  className,
  slideClassName = "basis-[62%] sm:basis-1/3 lg:basis-1/4 xl:basis-1/5",
}: {
  products: Product[];
  className?: string;
  slideClassName?: string;
}) {
  const [ref, api] = useEmblaCarousel({ align: "start", slidesToScroll: "auto", containScroll: "trimSnaps" });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    if (!api) return;
    setCanPrev(api.canScrollPrev());
    setCanNext(api.canScrollNext());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    update();
    api.on("select", update).on("reInit", update);
    return () => {
      api.off("select", update).off("reInit", update);
    };
  }, [api, update]);

  return (
    <div className={cn("relative", className)}>
      <div ref={ref} className="overflow-hidden px-1 py-2">
        <div className="-ml-3 flex sm:-ml-4">
          {products.map((p) => (
            <div
              key={p.slug}
              className={cn("min-w-0 shrink-0 grow-0 pl-3 sm:pl-4", slideClassName)}
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
      <CarouselArrow
        dir="prev"
        onClick={() => api?.scrollPrev()}
        disabled={!canPrev}
        className="absolute -left-3 top-1/2 hidden -translate-y-1/2 md:grid lg:-left-5"
      />
      <CarouselArrow
        dir="next"
        onClick={() => api?.scrollNext()}
        disabled={!canNext}
        className="absolute -right-3 top-1/2 hidden -translate-y-1/2 md:grid lg:-right-5"
      />
    </div>
  );
}
