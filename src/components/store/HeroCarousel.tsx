import heroBlack from "@/assets/hero-black-november.jpg";

export function HeroCarousel() {
  return (
    <section aria-label="Destaque principal" className="relative bg-ink">
      <div className="relative h-[440px] sm:h-[460px] lg:h-[520px]">
        <img
          src={heroBlack}
          alt="Seleção premium de iPhone dourado, fones de ouvido e smartwatch"
          width={1920}
          height={720}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-[72%_center] lg:object-center"
        />
      </div>
    </section>
  );
}
