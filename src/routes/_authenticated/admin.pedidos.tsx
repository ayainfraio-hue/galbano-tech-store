import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DateRangeFilter } from "@/components/admin/DateRangeFilter";
import { EmptyState, PageHeader, Panel, StatusBadge, formatDateTime } from "@/components/admin/AdminUi";
import { WhatsAppIcon } from "@/components/store/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { fetchOrdersInRange } from "@/lib/admin-orders";
import { defaultDateFilter, formatRange, getDateRange, isInRange, type DateFilter } from "@/lib/date-range";
import { ORDER_STATUSES, isPaid, ordersTotal } from "@/lib/orders";
import { formatBRL } from "@/lib/pricing";
import { formatPhone } from "@/lib/whatsapp";

export const Route = createFileRoute("/_authenticated/admin/pedidos")({
  component: OrdersPage,
});

type Order = {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  status: string;
  total: number;
  items_count: number;
  stock_deducted: boolean;
  created_at: string;
};

function OrdersPage() {
  const [status, setStatus] = useState<string>("todos");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>(() => defaultDateFilter());
  const range = useMemo(() => getDateRange(dateFilter), [dateFilter]);

  const orders = useQuery({
    queryKey: ["admin", "orders", range.start.toISOString(), range.end.toISOString()],
    queryFn: () =>
      fetchOrdersInRange<Order>("id, order_number, customer_name, customer_phone, status, total, items_count, stock_deducted, created_at", range),
    placeholderData: keepPreviousData,
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (orders.data ?? []).filter(
      (o) =>
        isInRange(o.created_at, range) &&
        (status === "todos" || o.status === status) &&
        (!term || o.customer_name.toLowerCase().includes(term) || o.customer_phone.includes(term.replace(/\D/g, "") || "§") || String(o.order_number) === term.replace("#", "")),
    );
  }, [orders.data, status, q, range]);

  const current = orders.data?.find((o) => o.id === selected) ?? null;

  return (
    <>
      <PageHeader title="Pedidos" description="Pedidos registrados antes do envio ao WhatsApp. O estoque baixa quando o pedido é marcado como Pago." />
      <DateRangeFilter value={dateFilter} onChange={setDateFilter} className="mb-2" />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, telefone ou nº" className="bg-white pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="bg-white sm:w-56" aria-label="Filtrar status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={`mb-4 grid grid-cols-2 gap-3 transition-opacity ${orders.isFetching && !orders.isLoading ? "opacity-60" : ""}`}>
        <Panel className="p-4">
          <p className="text-xs text-muted-foreground">Pedidos exibidos</p>
          <p className="mt-0.5 font-display text-xl font-bold sm:text-2xl">{orders.isLoading ? "…" : filtered.length}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{formatRange(range)}</p>
        </Panel>
        <Panel className="p-4">
          <p className="text-xs text-muted-foreground">Valor dos pedidos</p>
          <p className="mt-0.5 font-display text-xl font-bold sm:text-2xl">{orders.isLoading ? "…" : formatBRL(ordersTotal(filtered))}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {status === "todos" ? "Soma de todos os status, inclusive não pagos e cancelados" : `Soma dos pedidos com status ${status}`}
          </p>
        </Panel>
      </div>

      <Panel>
        {filtered.length === 0 ? (
          <EmptyState>{orders.isLoading ? "Carregando…" : orders.error ? "Não foi possível carregar os pedidos." : "Nenhum pedido encontrado."}</EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => setSelected(o.id)}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-secondary/50 sm:grid-cols-[90px_minmax(0,1fr)_120px_110px_170px]"
                >
                  <span className="hidden font-display font-bold text-gold sm:block">#{o.order_number}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium"><span className="text-gold sm:hidden">#{o.order_number} · </span>{o.customer_name}</span>
                    <span className="block text-xs text-muted-foreground">{formatPhone(o.customer_phone)} · {formatDateTime(o.created_at)}</span>
                  </span>
                  <span className="hidden text-muted-foreground sm:block">{o.items_count} {o.items_count === 1 ? "item" : "itens"}</span>
                  <span className="hidden font-semibold sm:block">{formatBRL(Number(o.total))}</span>
                  <span className="justify-self-end"><StatusBadge status={o.status} /></span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <OrderSheet order={current} onClose={() => setSelected(null)} />
    </>
  );
}

function OrderSheet({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const items = useQuery({
    queryKey: ["admin", "order-items", order?.id],
    enabled: !!order,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("id, product_name, sku, unit_price, quantity, subtotal")
        .eq("order_id", order!.id)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const update = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", order!.id);
      if (error) throw error;
      return status;
    },
    onSuccess: (status) => {
      toast.success(`Pedido #${order!.order_number}: ${status}`, {
        description: isPaid(status) && !order!.stock_deducted ? "Estoque atualizado com a venda." : status === "Cancelado" && order!.stock_deducted ? "Itens devolvidos ao estoque." : undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["store-products"] });
    },
    onError: (err: { message?: string }) => {
      toast.error("Não foi possível alterar o status", {
        description: err.message?.includes("Estoque insuficiente") ? err.message : "Tente novamente.",
      });
    },
  });

  const phone = order ? (order.customer_phone.startsWith("55") ? order.customer_phone : `55${order.customer_phone}`) : "";

  return (
    <Sheet open={!!order} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto border-border bg-background p-0 sm:max-w-lg">
        {order && (
          <>
            <SheetHeader className="border-b border-border px-5 py-4 text-left">
              <SheetTitle className="font-display text-xl">Pedido #{order.order_number}</SheetTitle>
              <SheetDescription>{formatDateTime(order.created_at)}</SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-5 py-5">
              <div className="rounded-2xl border border-border bg-panel p-4 text-sm">
                <p className="font-semibold">{order.customer_name}</p>
                <p className="mt-0.5 text-muted-foreground">{formatPhone(order.customer_phone)}</p>
                <Button asChild variant="whatsapp" size="sm" className="mt-3 rounded-full">
                  <a href={`https://wa.me/${phone}?text=${encodeURIComponent(`Olá, ${order.customer_name}! Sobre o seu pedido nº ${order.order_number} na Gálbano Tech:`)}`} target="_blank" rel="noreferrer">
                    <WhatsAppIcon /> Conversar com o cliente
                  </a>
                </Button>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Status</p>
                <Select value={order.status} onValueChange={(v) => update.mutate(v)} disabled={update.isPending}>
                  <SelectTrigger aria-label="Status do pedido"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-2 text-xs text-muted-foreground">
                  {order.stock_deducted
                    ? "O estoque deste pedido já foi baixado. Ao cancelar, os itens voltam ao estoque."
                    : "O estoque ainda não foi baixado. Ele baixa automaticamente ao marcar como Pago."}
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Itens</p>
                <ul className="divide-y divide-border rounded-2xl border border-border bg-panel">
                  {(items.data ?? []).map((i) => (
                    <li key={i.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
                      <span className="min-w-0">
                        <span className="block font-medium">{i.product_name}</span>
                        <span className="block text-xs text-muted-foreground">Cód. {i.sku} · {i.quantity} x {formatBRL(Number(i.unit_price))}</span>
                      </span>
                      <span className="shrink-0 font-semibold">{formatBRL(Number(i.subtotal))}</span>
                    </li>
                  ))}
                  {items.isLoading && <li className="px-4 py-3 text-sm text-muted-foreground">Carregando…</li>}
                </ul>
                <div className="mt-3 flex items-end justify-between px-1">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-display text-2xl font-extrabold text-gold-gradient">{formatBRL(Number(order.total))}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
