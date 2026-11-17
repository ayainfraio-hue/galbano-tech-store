import { BadgeCheck, MessageCircle, ShieldCheck, Truck, Zap } from "lucide-react";

const items = [
  { icon: MessageCircle, title: "Atendimento no WhatsApp", text: "Fale direto com um vendedor" },
  { icon: Truck, title: "Entrega para todo o Brasil", text: "Envio rápido e rastreado" },
  { icon: ShieldCheck, title: "Compra segura", text: "Negociação transparente" },
  { icon: BadgeCheck, title: "Produtos com garantia", text: "Originais e lacrados" },
  { icon: Zap, title: "Ofertas toda semana", text: "Novidades em tecnologia" },
];

export function BenefitsBar() {
  return (
    <section className="container-store">
      <ul className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-0 lg:overflow-visible lg:rounded-2xl lg:border lg:border-border lg:bg-card lg:px-0">
        {items.map((it) => (
          <li
            key={it.title}
            className="flex min-w-[220px] snap-start items-center gap-3 rounded-xl border border-border bg-card p-4 lg:min-w-0 lg:rounded-none lg:border-0 lg:border-r lg:bg-transparent lg:last:border-r-0"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold/10 text-gold ring-1 ring-gold/30">
              <it.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-tight">{it.title}</span>
              <span className="block text-xs text-muted-foreground">{it.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
