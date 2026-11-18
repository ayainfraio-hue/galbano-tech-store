import { whatsappUrl } from "@/lib/whatsapp";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { useStoreSettings } from "@/lib/store-content";

export function WhatsAppFloat() {
  const settings = useStoreSettings().data;
  return (
    <a
      href={whatsappUrl("Olá, Gálbano Tech! Gostaria de tirar uma dúvida.", settings?.whatsapp_number)}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-card ring-4 ring-whatsapp/20 transition hover:scale-105"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
