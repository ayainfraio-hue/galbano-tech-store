/** A loja exibe apenas o preço (sem condições de pagamento), conforme definido pelo cliente. */
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(value: number) {
  return brl.format(value).replace(/\u00a0/g, " ");
}

export function roundCents(value: number) {
  return Math.round(value * 100) / 100;
}

export function discountPercent(price: number, oldPrice?: number) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round((1 - price / oldPrice) * 100);
}
