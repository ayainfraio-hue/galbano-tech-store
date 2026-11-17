import { Link } from "@tanstack/react-router";
import { ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/pricing";
import { CheckoutDialog } from "./CheckoutDialog";
import { QuantityStepper } from "./QuantityStepper";
import { WhatsAppIcon } from "./WhatsAppIcon";

export function CartDrawer() {
  const { lines, count, total, isOpen, setOpen, setQuantity, remove, clear } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 border-border bg-background p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border px-5 py-4 text-left">
            <SheetTitle className="font-display text-lg">Meu carrinho</SheetTitle>
            <SheetDescription>
              {count > 0 ? `${count} ${count === 1 ? "item" : "itens"} no carrinho` : "Seu carrinho está vazio"}
            </SheetDescription>
          </SheetHeader>

          {lines.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-gold/10 ring-1 ring-gold/40">
                <ShoppingBag className="h-7 w-7 text-gold" />
              </span>
              <p className="mt-4 text-sm text-muted-foreground">Adicione produtos para montar o seu pedido.</p>
              <Button variant="gold" className="mt-5 rounded-full" onClick={() => setOpen(false)}>
                Continuar comprando
              </Button>
            </div>
          ) : (
            <>
              <ul className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                {lines.map((line) => (
                  <li key={line.product.slug} className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-2xl border border-border bg-card p-3">
                    <Link
                      to="/produto/$slug"
                      params={{ slug: line.product.slug }}
                      onClick={() => setOpen(false)}
                      className="block self-start overflow-hidden rounded-xl bg-surface p-1.5"
                    >
                      <img src={line.product.image} alt={line.product.name} className="aspect-square w-full object-contain mix-blend-multiply" />
                    </Link>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-medium leading-snug">{line.product.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{formatBRL(line.price)} / un.</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <QuantityStepper
                          value={line.quantity}
                          onChange={(v) => setQuantity(line.product.slug, v)}
                          className="h-9 [&_button]:h-9 [&_button]:w-9"
                        />
                        <button
                          type="button"
                          onClick={() => remove(line.product.slug)}
                          aria-label={`Remover ${line.product.name}`}
                          className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-1.5 text-right font-display font-bold">{formatBRL(line.price * line.quantity)}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="border-t border-border bg-panel px-5 py-4">
                <div className="flex items-end justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-display text-2xl font-extrabold text-gold-gradient">{formatBRL(total)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Frete, pagamento e entrega combinados no WhatsApp.</p>
                <Button variant="whatsapp" size="xl" className="mt-4 w-full rounded-full" onClick={() => setCheckoutOpen(true)}>
                  <WhatsAppIcon className="h-5 w-5" /> Finalizar pedido pelo WhatsApp
                </Button>
                <Button variant="outline-gold" size="lg" className="mt-2 w-full rounded-full" onClick={() => setOpen(false)}>
                  Continuar comprando
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        items={lines.map((l) => ({ slug: l.product.slug, name: l.name, sku: l.sku, price: l.price, quantity: l.quantity }))}
        onOrderCreated={() => {
          clear();
          setOpen(false);
        }}
      />
    </>
  );
}
