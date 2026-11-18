import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/pricing";
import { useStoreSettings } from "@/lib/store-content";
import { buildOrderMessage, isValidPhone, normalizePhone, orderTotals, whatsappUrl, type OrderLine } from "@/lib/whatsapp";
import { WhatsAppIcon } from "./WhatsAppIcon";

export interface CheckoutItem extends OrderLine {
  slug: string;
}

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(100, "Nome muito longo"),
  phone: z.string().trim().refine(isValidPhone, "Informe um telefone com DDD, ex.: (62) 99999-9999"),
});

interface CreatedOrder {
  order_number: number;
  customer_name: string;
  customer_phone: string;
  total: number;
  items: OrderLine[];
}

function maskPhone(value: string) {
  const d = normalizePhone(value).slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Pop-up de finalização: registra o pedido no banco e só depois abre o WhatsApp. */
export function CheckoutDialog({
  open,
  onOpenChange,
  items,
  onOrderCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CheckoutItem[];
  onOrderCreated?: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: string | undefined; phone?: string | undefined }>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ number: number; url: string } | null>(null);
  const settings = useStoreSettings().data;
  const { total } = orderTotals(items);

  useEffect(() => {
    if (!open) {
      setDone(null);
      setErrors({});
    }
  }, [open]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ name, phone });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({ name: fieldErrors.name?.[0], phone: fieldErrors.phone?.[0] });
      return;
    }
    setErrors({});
    setSubmitting(true);
    // Abre a aba já no clique para o navegador não bloquear; o endereço do WhatsApp entra depois do registro.
    const win = window.open("", "_blank");
    try {
      const { data, error } = await supabase.rpc("create_order", {
        _customer_name: parsed.data.name,
        _customer_phone: normalizePhone(parsed.data.phone),
        _items: items.map((i) => ({ slug: i.slug, quantity: i.quantity, options: i.options ?? {} })),
      });
      if (error || !data) throw new Error(error?.message ?? "Falha ao registrar o pedido");
      const order = data as unknown as CreatedOrder;
      const message = buildOrderMessage(
        order.items.map((i) => ({ ...i, price: Number(i.price) })),
        { orderNumber: order.order_number, customerName: order.customer_name, customerPhone: order.customer_phone },
      );
      const url = whatsappUrl(message, settings?.whatsapp_number);
      if (win) win.location.href = url;
      else window.location.href = url;
      setDone({ number: order.order_number, url });
      onOrderCreated?.();
    } catch (err) {
      win?.close();
      const msg = err instanceof Error ? err.message : "";
      toast.error("Não foi possível registrar o pedido", {
        description: /indispon|inválid|vazio|nome|telefone|estoque/i.test(msg) ? msg : "Tente novamente em instantes.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-gold/30 bg-panel">
        {done ? (
          <div className="flex flex-col items-center py-4 text-center">
            <CheckCircle2 className="h-14 w-14 text-whatsapp" />
            <DialogHeader className="mt-4 items-center">
              <DialogTitle className="text-xl">Pedido nº {done.number} registrado!</DialogTitle>
              <DialogDescription>
                Abrimos o WhatsApp da Gálbano Tech com o resumo do seu pedido. É só enviar a mensagem.
              </DialogDescription>
            </DialogHeader>
            <Button asChild variant="whatsapp" size="xl" className="mt-6 w-full rounded-full">
              <a href={done.url} target="_blank" rel="noreferrer">
                <WhatsAppIcon className="h-5 w-5" /> Abrir WhatsApp novamente
              </a>
            </Button>
            <Button variant="ghost" className="mt-2" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <DialogHeader>
              <DialogTitle className="text-xl">Finalizar pedido</DialogTitle>
              <DialogDescription>
                Informe seus dados para registrarmos o pedido. Em seguida você será levado ao WhatsApp.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="checkout-name">Nome</Label>
                <Input
                  id="checkout-name"
                  autoComplete="name"
                  value={name}
                  maxLength={100}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="checkout-phone">Telefone (WhatsApp)</Label>
                <Input
                  id="checkout-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  placeholder="(62) 99999-9999"
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                {items.reduce((s, i) => s + i.quantity, 0)} {items.length === 1 && items[0]?.quantity === 1 ? "item" : "itens"}
              </span>
              <span className="font-display text-lg font-bold text-gold-gradient">{formatBRL(total)}</span>
            </div>
            <Button type="submit" variant="whatsapp" size="xl" className="mt-5 w-full rounded-full" disabled={submitting || items.length === 0}>
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <WhatsAppIcon className="h-5 w-5" />}
              {submitting ? "Registrando pedido..." : "Confirmar e abrir WhatsApp"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
