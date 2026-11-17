import { Link } from "@tanstack/react-router";

import { brands } from "@/data/catalog";
import { SectionTitle } from "./SectionTitle";

export function BrandsRow() {
  return (
    <section className="container-store">
      <SectionTitle eyebrow="Parceiros" title="As melhores marcas" />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {brands.map((b) => (
          <li key={b}>
            <Link
              to="/busca"
              search={{ q: b }}
              className="flex h-20 items-center justify-center rounded-xl border border-surface-border bg-surface font-display text-xl font-extrabold uppercase tracking-widest text-surface-foreground transition hover:-translate-y-0.5 hover:ring-2 hover:ring-gold"
            >
              {b}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
