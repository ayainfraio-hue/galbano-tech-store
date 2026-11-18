import { Link } from "@tanstack/react-router";

import { categories } from "@/data/catalog";
import { WHATSAPP_DISPLAY, formatWhatsAppDisplay, whatsappUrl } from "@/lib/whatsapp";
import { Logo } from "./Logo";
import { useStoreSettings } from "@/lib/store-content";
import { WhatsAppIcon } from "./WhatsAppIcon";

export function Footer() {
  const settings = useStoreSettings().data;
  return (
    <footer className="mt-20 border-t border-border bg-ink">
      <div className="gold-divider" />
      <div className="container-store grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Loja de tecnologia e eletrônicos com curadoria premium e atendimento personalizado pelo WhatsApp.
          </p>
          <div className="mt-5 flex gap-2">
            <a href={whatsappUrl(undefined, settings?.whatsapp_number)} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-gold hover:text-gold">
              <WhatsAppIcon className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-gold">Departamentos</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link to="/categoria/$slug" params={{ slug: c.slug }} className="text-muted-foreground transition hover:text-foreground">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-gold">Central de atendimento</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>
              <a href={whatsappUrl(undefined, settings?.whatsapp_number)} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-semibold text-foreground hover:text-gold">
                <WhatsAppIcon className="h-4 w-4 text-whatsapp" /> {settings?.whatsapp_number ? formatWhatsAppDisplay(settings.whatsapp_number) : WHATSAPP_DISPLAY}
              </a>
            </li>
            {settings?.email && <li><a href={`mailto:${settings.email}`} className="hover:text-gold">{settings.email}</a></li>}
            {settings?.instagram && <li><a href={settings.instagram.startsWith("http") ? settings.instagram : `https://instagram.com/${settings.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="hover:text-gold">{settings.instagram}</a></li>}
            {settings?.business_hours && <li>{settings.business_hours}</li>}
            {settings?.address && <li>{settings.address}</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-store flex flex-col gap-2 py-5 pb-24 text-xs text-muted-foreground sm:flex-row sm:pb-5 sm:pr-24 sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Gálbano Tech. Todos os direitos reservados.</p>
          <p>Preços e condições confirmados no atendimento via WhatsApp. Imagens meramente ilustrativas.</p>
        </div>
      </div>
    </footer>
  );
}
