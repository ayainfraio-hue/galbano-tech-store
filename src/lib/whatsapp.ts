import { formatBRL, roundCents } from "./pricing";

/** WhatsApp comercial da Gálbano Tech: +55 62 9264-3627 */
export const WHATSAPP_NUMBER = "556292643627";
export const WHATSAPP_DISPLAY = "+55 62 9264-3627";

export interface OrderLine {
  name: string;
  sku: string;
  price: number;
  quantity: number;
}

export function orderTotals(lines: OrderLine[]) {
  const total = roundCents(lines.reduce((sum, l) => sum + l.price * l.quantity, 0));
  const items = lines.reduce((sum, l) => sum + l.quantity, 0);
  return { total, items };
}

export function buildOrderMessage(lines: OrderLine[]) {
  const { total } = orderTotals(lines);
  const body = lines
    .map(
      (l, i) =>
        `${i + 1}. ${l.name}\n   Cód: ${l.sku} | Qtd: ${l.quantity} x ${formatBRL(l.price)} = ${formatBRL(
          roundCents(l.price * l.quantity),
        )}`,
    )
    .join("\n\n");

  return [
    "Olá, Gálbano Tech! Gostaria de finalizar o meu pedido:",
    "",
    body,
    "",
    `*Total: ${formatBRL(total)}*`,
    "",
    "Aguardo o retorno para combinar pagamento e entrega. Obrigado!",
  ].join("\n");
}

export function whatsappUrl(message?: string) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
