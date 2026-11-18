import { formatBRL, roundCents } from "./pricing";

/** WhatsApp comercial da Gálbano Tech: +55 62 9264-3627 */
export const WHATSAPP_NUMBER = "556292643627";
export const WHATSAPP_DISPLAY = "+55 62 9264-3627";

export interface OrderLine {
  name: string;
  sku: string;
  price: number;
  quantity: number;
  options?: Record<string, string>;
}

/** Dados do pedido já registrado no banco, incluídos na mensagem. */
export interface OrderInfo {
  orderNumber: number | string;
  customerName: string;
  customerPhone: string;
}

export function orderTotals(lines: OrderLine[]) {
  const total = roundCents(lines.reduce((sum, l) => sum + l.price * l.quantity, 0));
  const items = lines.reduce((sum, l) => sum + l.quantity, 0);
  return { total, items };
}

/** Só dígitos; aceita com ou sem +55. */
export function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

/** Telefone brasileiro válido: DDD + número (10 ou 11 dígitos), opcionalmente com 55 na frente. */
export function isValidPhone(value: string) {
  const d = normalizePhone(value);
  return /^(55)?[1-9]{2}9?\d{8}$/.test(d);
}

export function formatPhone(value: string) {
  let d = normalizePhone(value);
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return value;
}

export function buildOrderMessage(lines: OrderLine[], info?: OrderInfo) {
  const { total } = orderTotals(lines);
  const body = lines
    .map(
      (l, i) =>
        `${i + 1}. ${l.name}${l.options && Object.keys(l.options).length ? `\n   Opções: ${Object.entries(l.options).map(([key, value]) => `${key}: ${value}`).join(" · ")}` : ""}\n   Cód: ${l.sku} | Qtd: ${l.quantity} x ${formatBRL(
          roundCents(l.price * l.quantity),
        )}`,
    )
    .join("\n\n");

  const header = info
    ? [`*Pedido nº ${info.orderNumber}*`, `Cliente: ${info.customerName}`, `Telefone: ${formatPhone(info.customerPhone)}`, ""]
    : [];

  return [
    "Olá, Gálbano Tech! Gostaria de finalizar o meu pedido:",
    "",
    ...header,
    body,
    "",
    `*Total: ${formatBRL(total)}*`,
    "",
    "Aguardo o retorno para combinar pagamento e entrega. Obrigado!",
  ].join("\n");
}

export function formatWhatsAppDisplay(value: string) {
  const digits = normalizePhone(value);
  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  return `${digits.startsWith("55") ? "+55 " : ""}${formatPhone(local)}`;
}

export function whatsappUrl(message?: string, number: string = WHATSAPP_NUMBER) {
  const safeNumber = normalizePhone(number) || WHATSAPP_NUMBER;
  const base = `https://wa.me/${safeNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
