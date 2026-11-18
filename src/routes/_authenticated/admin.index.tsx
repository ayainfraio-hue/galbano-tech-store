import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ClipboardList, Package, Wallet } from "lucide-react";

import { EmptyState, PageHeader, Panel, StatusBadge, formatDateTime } from "@/components/admin/AdminUi";
import { supabase } from "@/integrations/supabase/client";
import { revenue } from "@/lib/orders";
import { useStoreSettings } from "@/lib/store-content";
import { formatBRL } from "@/lib/pricing";
import { useStoreSettings } from "@/lib/store-content";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const settings = useStoreSettings().data;\n  const settings = useStoreSettings().data;
  const orders = useQuery({
    queryKey: ["admin", "orders-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, status, total, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data;
    },
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
  const threshold = settings?.low_stock_threshold ?? 3;\n  const low = (products.data ?? []).filter((p) => p.active && p.stock <= threshold);
  const cards = [
    { label: "Pedidos", value: String(list.length), icon: ClipboardList },
    { label: "Novos", value: String(list.filter((o) => o.status === "Novo").length), icon: ClipboardList },
    { label: "Faturamento (pagos)", value: formatBRL(revenue(list)), icon: Wallet },
    { label: "Estoque baixo", value: String(low.length), icon: AlertTriangle },
  ];

  return (
    <>
      <PageHeader title="Visão geral" description="Resumo dos pedidos e do estoque da loja." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Panel key={c.label} className="p-4">
            <c.icon className="h-5 w-5 text-gold" />
            <p className="mt-3 text-xs text-muted-foreground">{c.label}</p>
            <p className="mt-0.5 font-display text-xl font-bold sm:text-2xl">{orders.isLoading ? "…" : c.value}</p>
          </Panel>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel>
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="font-semibold">Últimos pedidos</h2>
            <Link to="/admin/pedidos" className="text-sm text-gold hover:underline">Ver todos</Link>
          </div>
          {list.length === 0 ? (
            <EmptyState>{orders.isLoading ? "Carregando…" : "Nenhum pedido ainda."}</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {list.slice(0, 6).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">#{o.order_number} · {o.customer_name}</p>
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
            <h2 className="font-semibold">Estoque baixo</h2>
            <Link to="/admin/estoque" className="text-sm text-gold hover:underline">Estoque</Link>
          </div>
          {low.length === 0 ? (
            <EmptyState>Nenhum produto abaixo do mínimo.</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {low.slice(0, 8).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
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
      </div>
    </>
  );
}
