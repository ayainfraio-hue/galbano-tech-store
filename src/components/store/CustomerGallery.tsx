import { useState } from "react";
import { useCustomerGallery } from "@/lib/store-content";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SectionTitle } from "./SectionTitle";

export function CustomerGallery() {
  const gallery = useCustomerGallery();
  const [selected, setSelected] = useState<(NonNullable<typeof gallery.data>[number]) | null>(null);
  const items = gallery.data ?? [];


  return (
    <section className="container-store">
      <SectionTitle eyebrow="Experiências reais" title="Quem compra, recomenda" />
      {gallery.isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Carregando experiências de clientes...</p>
      ) : gallery.isError ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Não foi possível carregar os depoimentos agora.</p>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Novos depoimentos de clientes em breve.</p>
      ) : (
      <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 py-3 sm:mx-0 sm:px-0">
        {items.map((item) => (
          <button key={item.id} type="button" onClick={() => setSelected(item)} className="group w-64 shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-panel text-left transition hover:-translate-y-1 hover:border-gold sm:w-72">
            <img src={item.image_url} alt={`Depoimento de ${item.customer_name}`} loading="lazy" className="h-56 w-full object-cover transition duration-500 group-hover:scale-[1.02]" />
            <div className="p-4">
              <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">“{item.message}”</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-gold">{item.customer_name}</p>
              <span className="mt-2 inline-block text-xs font-semibold text-foreground">Ler depoimento completo →</span>
            </div>
          </button>
        ))}
      </div>
      )}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-gold/30 bg-panel sm:max-w-2xl">
          {selected && <>
            <DialogHeader>
              <DialogTitle>{selected.customer_name}</DialogTitle>
              <DialogDescription>Experiência de cliente Gálbano Tech</DialogDescription>
            </DialogHeader>
            <img src={selected.image_url} alt={`Depoimento de ${selected.customer_name}`} loading="lazy" decoding="async" className="max-h-[55vh] w-full rounded-xl object-contain" />
            <blockquote className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">“{selected.message}”</blockquote>
          </>}
        </DialogContent>
      </Dialog>
    </section>
  );
}
