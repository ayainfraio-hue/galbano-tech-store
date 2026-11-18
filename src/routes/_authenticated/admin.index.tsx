import { Link, createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AlertTriangle, BadgeCheck, ClipboardList, Package, Receipt, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import { DateRangeFilter } from "@/components/admin/DateRangeFilter";
import { EmptyState, PageHeader, Panel, StatusBadge, formatDateTime } from "@/components/admin/AdminUi";
import { supabase } from "@/integrations/supabase/client";
import { fetchOrdersInRange } from "@/lib/admin-orders";
import { defaultDateFilter, formatRange, getDateRange, type DateFilter } from "@/lib/date-range";
import { averageTicket, confirmedSales, revenue } from "@/lib/orders";
import { useStoreSettings } from "@/lib/store-content";
import { formatBRL } from "@/lib/pricing";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

type SummaryOrder = {
  id: string;
  order_number: number;
  customer_name: string;
  status: string;
  total: number;
  created_at: string;
};

function Dashboard() {
  const settings = useStoreSettings().data;
  // Sempre abre em "Hoje", calculado com a data local no momento em que a página abre.
  const [filter, setFilter] = useState<DateFilter>(() => defaultDateFilter());
  const range = useMemo(() => getDateRange(filter), [filter]);

  const orders = useQuery({
    queryKey: ["admin", "orders-summary", range.start.toISOString(), range.end.toISOString()],
    queryFn: () => fetchOrdersInRange<SummaryOrder>("id, order_number, customer_name, status, total, created_at", range),
    placeholderData: keepPreviousData,
  });
  const products = useQuery({
    queryKey: ["admin", "products-stock"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name, stock, min_stock, active").order("stock");
      if (error) throw error;
      return data;
    },
  });

  const list = orders.data ?? [];
  const sales = confirmedSales(list);
  const threshold = settings?.low_stock_threshold ?? 3;
  const low = (products.data ?? []).filter((p) => p.active && p.stock <= threshold);
  const loading = orders.isLoading;
  const newCount = list.filter((o) => o.status === "Novo").length;

  const cards = [
    { label: "Pedidos no período", value: String(list.length), hint: `${newCount} ${newCount === 1 ? "novo" : "novos"}`, icon: ClipboardList },
    { label: "Faturamento confirmado", value: formatBRL(revenue(list)), hint: `${sales.length} ${sales.length === 1 ? "venda confirmada" : "vendas confirmadas"}`, icon: Wallet },
    { label: "Ticket médio", value: formatBRL(averageTicket(list)), hint: "por venda confirmada", icon: Receipt },
    { label: "Estoque baixo", value: String(low.length), hint: "situação atual", icon: AlertTriangle },
  ];

  return (
    <>
      <PageHeader
        title="Visão geral"
        description="Pedidos, vendas e estoque da loja no período selecionado."
        actions={<DateRangeFilter value={filter} onChange={setFilter} />}
      />
      {orders.error && (
        <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Não foi possível carregar os pedidos do período.
        </p>
      )}
      <div className={`grid grid-cols-2 gap-3 transition-opacity lg:grid-cols-4 ${orders.isFetching && !loading ? "opacity-60" : ""}`}>
        {cards.map((c) => (
          <Panel key={c.label} className="p-4">
            <c.icon className="h-5 w-5 text-gold" />
            <p className="mt-3 text-xs text-muted-foreground">{c.label}</p>
            <p className="mt-0.5 font-display text-xl font-bold sm:text-2xl">{loading && c.icon !== AlertTriangle ? "…" : c.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{c.hint}</p>
          </Panel>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Faturamento e ticket médio consideram apenas pedidos Pago, Enviado ou Concluído — cancelados e não pagos ficam de fora.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel>
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="font-semibold">Últimos pedidos</h2>
              <p className="text-xs text-muted-foreground">Todos os status · {formatRange(range)}</p>
            </div>
            <Link to="/admin/pedidos" className="text-sm text-gold hover:underline">Ver todos</Link>
          </div>
          {list.length === 0 ? (
            <EmptyState>{loading ? "Carregando…" : "Nenhum pedido no período."}</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {list.slice(0, 6).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">#{o.order_number} · {o.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(o.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden font-semibold sm:inline">{formatBRL(Number(o.total))}</span>
                    <StatusBadge status={o.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="font-semibold">Vendas confirmadas</h2>
              <p className="text-xs text-muted-foreground">Pago, Enviado ou Concluído · {formatRange(range)}</p>
            </div>
            <span className="text-sm font-semibold">{loading ? "…" : formatBRL(revenue(list))}</span>
          </div>
          {sales.length === 0 ? (
            <EmptyState>{loading ? "Carregando…" : "Nenhuma venda confirmada no período."}</EmptyState>
          ) : (
            <ul className="max-h-[420px] divide-y divide-border overflow-y-auto">
              {sales.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-whatsapp" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">#{o.order_number} · {o.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(o.created_at)} · {o.status}</p>
                    </div>
                  </div>
                  <span className="shrink-0 font-semibold">{formatBRL(Number(o.total))}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel className="mt-6">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="font-semibold">Estoque baixo</h2>
            <p className="text-xs text-muted-foreground">Situação atual do estoque (não depende do período)</p>
          </div>
          <Link to="/admin/estoque" className="text-sm text-gold hover:underline">Estoque</Link>
        </div>
        {low.length === 0 ? (
          <EmptyState>{products.isLoading ? "Carregando…" : "Nenhum produto abaixo do mínimo."}</EmptyState>
        ) : (
          <ul className="grid divide-y divide-border sm:grid-cols-2 sm:divide-y-0">
            {low.slice(0, 8).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 border-border px-4 py-3 text-sm sm:border-b">
                <span className="flex min-w-0 items-center gap-2">
                  <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{p.name}</span>
                </span>
                <span className="shrink-0 font-semibold text-destructive">{p.stock} un.</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
