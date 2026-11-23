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
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/55 to-transparent" />
        <div className="container-store relative z-10 flex h-full items-center">
          <div className="max-w-xl pr-[28%] sm:pr-0">
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-white drop-shadow sm:text-5xl lg:text-6xl">
              Gálbano Tech
            </h1>
            <p className="mt-4 max-w-md text-base font-medium leading-relaxed text-white/90 drop-shadow sm:text-xl">
              Os melhores produtos você encontra aqui.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
