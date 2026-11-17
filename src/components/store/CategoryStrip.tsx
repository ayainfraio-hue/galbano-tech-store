import { Link } from "@tanstack/react-router";

import { categories } from "@/data/catalog";

export function CategoryStrip() {
  return (
    <section aria-label="Categorias" className="container-store">
      <div className="scrollbar-none -mx-4 overflow-x-auto px-4">
        <ul className="flex w-max gap-4 sm:gap-5 lg:w-full lg:justify-between">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link to="/categoria/$slug" params={{ slug: c.slug }} className="group flex w-24 flex-col items-center gap-2 sm:w-28">
                <span className="grid aspect-square w-full place-items-center overflow-hidden rounded-2xl border border-border bg-surface p-3 transition group-hover:-translate-y-1 group-hover:ring-2 group-hover:ring-gold">
                  <img src={c.image} alt="" loading="lazy" className="h-full w-full object-contain" />
                </span>
                <span className="text-center text-xs font-medium text-muted-foreground transition group-hover:text-gold sm:text-sm">
                  {c.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
