import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, ShoppingCart, Sparkles, Tag } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { WHATSAPP_DISPLAY, formatWhatsAppDisplay, whatsappUrl } from "@/lib/whatsapp";
import { Logo } from "./Logo";
import { useStoreSettings } from "@/lib/store-content";
import { WhatsAppIcon } from "./WhatsAppIcon";

const primaryNavItems = [
  { label: "Smartphones", slug: "smartphones" },
  { label: "Notebooks", slug: "notebooks" },
  { label: "Áudio", slug: "audio" },
  { label: "Smartwatches", slug: "smartwatches" },
  { label: "Tablets", slug: "tablets" },
] as const;

function SearchForm({ className }: { className?: string }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    navigate({ to: "/busca", search: { q: q.trim() || undefined } });
  }

  return (
    <form onSubmit={submit} role="search" className={className}>
      <label className="flex h-11 w-full items-center overflow-hidden rounded-full border border-border bg-secondary pl-4 pr-1 transition focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/30">
        <span className="sr-only">Buscar produtos</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="O que você está procurando hoje?"
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Buscar"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-gradient text-primary-foreground"
        >
          <Search className="h-4 w-4" />
        </button>
      </label>
    </form>
  );
}

function CartButton() {
  const { count, ready } = useCart();
  return (
    <Link
      to="/carrinho"
      aria-label={`Carrinho com ${count} itens`}
      className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border bg-secondary text-foreground transition hover:border-gold hover:text-gold"
    >
      <ShoppingCart className="h-5 w-5" />
      {ready && count > 0 && (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold-gradient px-1 text-[11px] font-bold text-primary-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}

function MobileMenu() {
  const [open, setOpen] = useState(false);
  const settings = useStoreSettings().data;
  const categories = useStoreCategories().data ?? [];
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Abrir menu"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border bg-secondary text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[86%] max-w-sm overflow-y-auto border-border bg-background p-0">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle className="text-left font-display text-lg text-gold">Categorias</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col p-3">
          <Link
            to="/categoria/$slug"
            params={{ slug: "ofertas" }}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-3 font-semibold text-gold hover:bg-secondary"
          >
            <Tag className="h-4 w-4" /> Ofertas
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              to="/categoria/$slug"
              params={{ slug: c.slug }}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-secondary"
            >
              <img src={c.image_url || getCategory(c.slug)?.image || ""} alt="" className="h-9 w-9 rounded-md bg-surface object-contain p-1" loading="lazy" />
              {c.name}
            </Link>
          ))}
        </nav>
        <div className="m-4 rounded-xl border border-border bg-panel p-4">
          <p className="text-sm text-muted-foreground">Atendimento comercial</p>
          <a href={whatsappUrl(undefined, settings?.whatsapp_number)} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-2 font-semibold text-foreground">
            <WhatsAppIcon className="h-4 w-4 text-whatsapp" /> {settings?.whatsapp_number ? formatWhatsAppDisplay(settings.whatsapp_number) : WHATSAPP_DISPLAY}
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function Header() {
  const settings = useStoreSettings().data;
  const categories = useStoreCategories().data ?? [];
  const notices = [settings?.top_notice_1, settings?.top_notice_2].filter((value): value is string => Boolean(value?.trim()));
  const [noticeIndex, setNoticeIndex] = useState(0);
  useEffect(() => { if (notices.length < 2) return; const timer = window.setInterval(() => setNoticeIndex((index) => (index + 1) % notices.length), 5000); return () => window.clearInterval(timer); }, [notices.length]);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-ink/95 backdrop-blur">
      <div className="hidden bg-gold-gradient text-primary-foreground sm:block">
        <div className="container-store flex h-8 items-center justify-center text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-center">
            <Sparkles className="h-3.5 w-3.5" /> {notices[noticeIndex] ?? "Tecnologia premium com atendimento personalizado"}
          </span>
        </div>
      </div>

      <div className="container-store grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-8">
        <div className="flex min-w-0 items-center gap-3">
          <MobileMenu />
          <Logo className="hidden sm:flex" />
        </div>
        <div className="flex min-w-0 justify-center sm:hidden">
          <Logo />
        </div>
        <SearchForm className="hidden sm:block" />
        <div className="flex items-center gap-3">
          <CartButton />
        </div>
      </div>

      <div className="container-store pb-3 sm:hidden">
        <SearchForm />
      </div>

      <nav aria-label="Categorias" className="border-t border-border">
        <div className="container-store flex h-12 items-center justify-between gap-2 overflow-x-auto">
          {primaryNavItems.map((item) => (
            <Link key={item.slug} to="/categoria/$slug" params={{ slug: item.slug }} className="shrink-0 rounded-md px-2 py-1.5 text-xs font-semibold text-muted-foreground transition hover:text-gold sm:px-3 sm:text-sm" activeProps={{ className: "text-gold" }}>
              {item.label}
            </Link>
          ))}
          <Link to="/categoria/$slug" params={{ slug: "ofertas" }} className="flex shrink-0 items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1.5 text-xs font-bold text-gold ring-1 ring-gold/40 transition hover:bg-gold hover:text-primary-foreground sm:text-sm">
            <Tag className="h-3.5 w-3.5" /> Ofertas
          </Link>
        </div>
      </nav>

    </header>
  );
}
