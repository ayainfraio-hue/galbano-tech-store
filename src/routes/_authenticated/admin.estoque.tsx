import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownCircle, ArrowUpCircle, Search } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader, Panel, formatDateTime } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useStoreSettings } from "@/lib/store-content";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/estoque")({
  component: StockPage,
});

type StockProduct = { id: string; name: string; sku: string; image_url: string; stock: number; min_stock: number; active: boolean };

const MOVEMENT_LABEL: Record<string, string> = { entrada: "Entrada", saida: "Saída", venda: "Venda", estorno: "Estorno" };

function StockPage() {
  const settings = useStoreSettings().data;
  const threshold = settings?.low_stock_threshold ?? 3;
  const [q, setQ] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const [moving, setMoving] = useState<{ product: StockProduct; type: "entrada" | "saida" } | null>(null);

  const products = useQuery({
    queryKey: ["admin", "stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, image_url, stock, min_stock, active")
        .order("name");
      if (error) throw error;
      return data as StockProduct[];
    },
  });
  const movements = useQuery({
    queryKey: ["admin", "movements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_movements")
        .select("id, type, quantity, reason, created_at, products(name)")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
  });

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (products.data ?? []).filter(
      (p) => (!onlyLow || isLowStock(p, threshold)) && (!term || p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)),
    );
  }, [products.data, q, onlyLow, threshold]);
  const lowCount = (products.data ?? []).filter((p) => isLowStock(p, threshold)).length;

  return (
    <>
      <PageHeader title="Estoque" description="Entradas e saídas manuais. Vendas baixam o estoque automaticamente quando o pedido é pago." />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto ou código" className="pl-9" />
        </div>
        <Button variant={onlyLow ? "gold" : "outline-gold"} onClick={() => setOnlyLow((v) => !v)}>
          Estoque baixo ({lowCount})
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel>
          {list.length === 0 ? (
            <EmptyState>{products.isLoading ? "Carregando…" : "Nenhum produto encontrado."}</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {list.map((p) => {
                const low = isLowStock(p, threshold);
                return (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                    <img src={p.image_url} alt="" className="h-11 w-11 shrink-0 rounded-lg bg-surface object-contain p-1" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.name}{!p.active && <span className="ml-2 text-xs text-muted-foreground">(oculto)</span>}</p>
                      <p className="text-xs text-muted-foreground">Cód. {p.sku} · mínimo {p.min_stock}</p>
                    </div>
                    <span className={cn("w-16 text-right font-display text-lg font-bold", low ? "text-destructive" : "text-foreground")}>
                      {p.stock}
                    </span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline-gold" onClick={() => setMoving({ product: p, type: "entrada" })} aria-label={`Entrada de ${p.name}`}>
                        <ArrowUpCircle /> Entrada
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setMoving({ product: p, type: "saida" })} aria-label={`Saída de ${p.name}`}>
                        <ArrowDownCircle /> Saída
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel className="self-start">
          <h2 className="border-b border-border px-4 py-3 font-semibold">Últimas movimentações</h2>
          {(movements.data ?? []).length === 0 ? (
            <EmptyState>{movements.isLoading ? "Carregando…" : "Nenhuma movimentação ainda."}</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {(movements.data ?? []).map((m) => {
                const positive = m.type === "entrada" || m.type === "estorno";
                return (
                  <li key={m.id} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate">{(m.products as { name: string } | null)?.name ?? "Produto removido"}</span>
                      <span className="block text-xs text-muted-foreground">
                        {MOVEMENT_LABEL[m.type] ?? m.type}{m.reason ? ` · ${m.reason}` : ""} · {formatDateTime(m.created_at)}
                      </span>
                    </span>
                    <span className={cn("shrink-0 font-semibold", positive ? "text-whatsapp" : "text-destructive")}>
                      {positive ? "+" : "−"}{m.quantity}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <MovementDialog moving={moving} onClose={() => setMoving(null)} />
    </>
  );
}

function MovementDialog({ moving, onClose }: { moving: { product: StockProduct; type: "entrada" | "saida" } | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [qty, setQty] = useState("1");
  const [reason, setReason] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      const quantity = Number.parseInt(qty, 10);
      if (!Number.isFinite(quantity) || quantity < 1 || quantity > 100000) throw new Error("Informe uma quantidade válida");
      const { error } = await supabase.from("stock_movements").insert({
        product_id: moving!.product.id,
        type: moving!.type,
        quantity,
        reason: reason.trim().slice(0, 200),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(moving!.type === "entrada" ? "Entrada registrada" : "Saída registrada");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["store-products"] });
      setQty("1");
      setReason("");
      onClose();
    },
    onError: (err: { message?: string }) => toast.error("Não foi possível registrar", { description: err.message }),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }

  return (
    <Dialog open={!!moving} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm border-gold/30 bg-panel">
        {moving && (
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>{moving.type === "entrada" ? "Entrada de estoque" : "Saída de estoque"}</DialogTitle>
              <DialogDescription>{moving.product.name} · atual: {moving.product.stock} un.</DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="mov-qty">Quantidade</Label>
                <Input id="mov-qty" type="number" min={1} inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mov-reason">Motivo (opcional)</Label>
                <Input
                  id="mov-reason"
                  value={reason}
                  maxLength={200}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={moving.type === "entrada" ? "Ex.: compra do fornecedor" : "Ex.: avaria, ajuste"}
                />
              </div>
            </div>
            <Button type="submit" variant="gold" className="mt-5 w-full rounded-full" disabled={save.isPending}>
              Registrar {moving.type === "entrada" ? "entrada" : "saída"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}


function isLowStock(product: StockProduct, threshold: number) {
  return product.stock <= Math.max(product.min_stock, threshold);
}
