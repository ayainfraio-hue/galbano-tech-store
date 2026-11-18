import { Link, Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Boxes, ClipboardList, ExternalLink, FolderTree, Image, LayoutDashboard, LogOut, Package, Settings, Tags, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import emblem from "@/assets/galbano-emblem.png.asset.json";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.rpc("has_role", { _user_id: context.user.id, _role: "admin" });
    return { isAdmin: data === true };
  },
  head: () => ({
    meta: [
      { title: "Painel — Gálbano Tech" },
      { name: "description", content: "Painel administrativo da Gálbano Tech: pedidos, produtos e estoque." },
      { property: "og:title", content: "Painel — Gálbano Tech" },
      { property: "og:description", content: "Painel administrativo da Gálbano Tech." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/admin/pedidos", label: "Pedidos", icon: ClipboardList, exact: false },
  { to: "/admin/produtos", label: "Produtos", icon: Package, exact: false },
  { to: "/admin/estoque", label: "Estoque", icon: Boxes, exact: false },
  { to: "/admin/galeria-clientes", label: "Galeria de clientes", icon: Image, exact: false },
  { to: "/admin/marcas", label: "Marcas", icon: Tags, exact: false },
  { to: "/admin/categorias", label: "Categorias", icon: FolderTree, exact: false },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings, exact: false },
] as const;

function AdminLayout() {
  const { isAdmin, user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.removeQueries({ predicate: (q) => q.queryKey[0] === "admin" });
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <ShieldAlert className="h-12 w-12 text-gold" />
        <h1 className="mt-4 text-2xl font-bold">Acesso restrito</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          A conta {user.email} não tem permissão de administrador. Entre com o e-mail autorizado.
        </p>
        <div className="mt-6 flex gap-2">
          <Button variant="outline-gold" className="rounded-full" onClick={signOut}>
            Trocar de conta
          </Button>
          <Button asChild variant="gold" className="rounded-full">
            <Link to="/">Ir para a loja</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-900 [--foreground:#1e293b] [--muted-foreground:#64748b] [--background:#f7f8fa] [--secondary:#f1f5f9] [--border:#e2e8f0] [--input:#e2e8f0] [--card:#ffffff] [--popover:#ffffff] lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="sticky top-0 z-30 border-b border-slate-200 bg-white lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:flex-col lg:items-start lg:px-5 lg:py-6">
          <Link to="/admin" className="flex items-center gap-2.5">
            <img src={emblem.url} alt="" className="h-9 w-auto" />
            <span className="leading-tight">
              <span className="block font-display text-sm font-bold text-gold-gradient">Gálbano Tech</span>
              <span className="block text-xs text-muted-foreground">Painel</span>
            </span>
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut} className="lg:hidden" aria-label="Sair">
            <LogOut />
          </Button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3 lg:pb-0">
          {nav.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              hash={"hash" in item ? item.hash : undefined}
              activeOptions={{ exact: item.exact }}
              className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              activeProps={{ className: "!bg-gold/15 !text-gold" }}
            >
              <item.icon className="h-4 w-4" /> {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden px-5 lg:absolute lg:bottom-6 lg:block lg:w-full">
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <div className="mt-3 flex flex-col gap-1">
            <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold">
              <ExternalLink className="h-4 w-4" /> Ver loja
            </a>
            <button type="button" onClick={signOut} className="flex items-center gap-2 text-left text-sm text-muted-foreground hover:text-gold">
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <Outlet />
      </main>
    </div>
  );
}
