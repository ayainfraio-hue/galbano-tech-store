/** Status de pedido usados no painel, na ordem do atendimento. */
export const ORDER_STATUSES = [
  "Novo",
  "Em atendimento",
  "Aguardando pagamento",
  "Pago",
  "Enviado",
  "Concluído",
  "Cancelado",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Pedidos que contam como faturamento: pagamento confirmado. */
export const PAID_STATUSES: OrderStatus[] = ["Pago", "Enviado", "Concluído"];

export function isPaid(status: string) {
  return (PAID_STATUSES as string[]).includes(status);
}

export function revenue(orders: { status: string; total: number | string }[]) {
  return Math.round(orders.filter((o) => isPaid(o.status)).reduce((sum, o) => sum + Number(o.total), 0) * 100) / 100;
}

export function isLowStock(p: { stock: number; min_stock: number }) {
  return p.stock <= p.min_stock;
}

export const STATUS_STYLES: Record<OrderStatus, string> = {
  Novo: "bg-gold/15 text-gold ring-gold/40",
  "Em atendimento": "bg-secondary text-foreground ring-border",
  "Aguardando pagamento": "bg-secondary text-gold ring-gold/30",
  Pago: "bg-whatsapp/15 text-whatsapp ring-whatsapp/40",
  Enviado: "bg-whatsapp/10 text-whatsapp ring-whatsapp/30",
  Concluído: "bg-secondary text-muted-foreground ring-border",
  Cancelado: "bg-destructive/15 text-destructive ring-destructive/40",
};
