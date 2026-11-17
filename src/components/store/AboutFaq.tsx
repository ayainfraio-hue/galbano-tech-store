import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import emblem from "@/assets/galbano-emblem.png.asset.json";

export const faqs = [
  {
    q: "Como faço meu pedido?",
    a: "Adicione os produtos ao carrinho e clique em “Finalizar pedido no WhatsApp”. Você será direcionado ao nosso WhatsApp comercial com a lista dos produtos, quantidades e o valor total. Um vendedor confirma tudo com você.",
  },
  {
    q: "Como funciona o pagamento?",
    a: "O pagamento não é feito no site. Ao finalizar pelo WhatsApp, nosso time combina com você a forma de pagamento e envia todas as informações com segurança.",
  },
  {
    q: "Vocês entregam em todo o Brasil?",
    a: "Sim. O prazo e o valor do frete são informados pelo vendedor no WhatsApp, de acordo com o seu CEP.",
  },
  {
    q: "Os produtos têm garantia?",
    a: "Todos os produtos são originais, lacrados e acompanham a garantia do fabricante.",
  },
  {
    q: "Posso tirar dúvidas antes de comprar?",
    a: "Claro! Fale com a gente pelo WhatsApp a qualquer momento. Teremos prazer em ajudar você a escolher o produto ideal.",
  },
];

export function AboutFaq() {
  return (
    <section className="container-store">
      <div className="grid gap-8 overflow-hidden rounded-3xl border border-surface-border bg-surface p-6 text-surface-foreground sm:p-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-deep">Quem somos?</span>
          <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">
            Tecnologia premium com atendimento próximo e de confiança
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-surface-muted-foreground">
            A Gálbano Tech nasceu para aproximar você dos melhores produtos de tecnologia e eletrônicos, com curadoria
            de marcas, preços competitivos e um atendimento humano, feito por especialistas, direto no WhatsApp.
          </p>
          <div className="mt-6 flex items-center gap-4 rounded-2xl bg-ink p-5">
            <img src={emblem.url} alt="" className="h-14 w-auto" loading="lazy" />
            <p className="text-sm text-muted-foreground">
              <span className="block font-display text-lg font-bold text-gold-gradient">Referência em tecnologia</span>
              Produtos originais, garantia e atendimento personalizado.
            </p>
          </div>
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-deep">Tire suas dúvidas</span>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Perguntas frequentes</h2>
          <Accordion type="single" collapsible className="mt-4">
            {faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`faq-${i}`} className="border-surface-border">
                <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
                  {String(i + 1).padStart(2, "0")}. {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-surface-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
