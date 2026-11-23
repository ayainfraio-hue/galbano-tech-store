import { Link } from "@tanstack/react-router";
import { useStoreBrands } from "@/lib/store-content";
import { SectionTitle } from "./SectionTitle";

export function BrandsRow() {
  const query = useStoreBrands();
  const brands = query.data ?? [];

  return (
    <section className="container-store">
      <SectionTitle eyebrow="Parceiros" title="As melhores marcas" />
      {query.isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Carregando marcas parceiras...</p>
      ) : query.isError ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Não foi possível carregar as marcas agora.</p>
      ) : brands.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Marcas parceiras em breve.</p>
      ) : (
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {brands.map((b) => (
          <li key={b.id}>
            <Link to="/busca" search={{ q: b.name }} className="flex h-20 items-center justify-center rounded-xl border border-surface-border bg-surface px-2 text-center font-display text-xl font-extrabold uppercase tracking-widest text-surface-foreground transition hover:-translate-y-0.5 hover:ring-2 hover:ring-gold">
              {b.name}
            </Link>
          </li>
        ))}
      </ul>
      )}
    </section>
  );
}
