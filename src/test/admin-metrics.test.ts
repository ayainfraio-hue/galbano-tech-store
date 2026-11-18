import { describe, expect, it } from "vitest";

import { averageTicket, confirmedSales, ordersTotal, revenue } from "@/lib/orders";
import { getDateRange, isInRange } from "@/lib/date-range";

const orders = [
  { status: "Novo", total: 100 },
  { status: "Aguardando pagamento", total: 200 },
  { status: "Pago", total: 300 },
  { status: "Enviado", total: 150.5 },
  { status: "Concluído", total: 49.5 },
  { status: "Cancelado", total: 1000 },
];

describe("Indicadores do painel", () => {
  it("vendas confirmadas são só Pago, Enviado e Concluído", () => {
    expect(confirmedSales(orders).map((o) => o.status)).toEqual(["Pago", "Enviado", "Concluído"]);
  });

  it("faturamento ignora cancelados e não pagos", () => {
    expect(revenue(orders)).toBe(500);
  });

  it("ticket médio = faturamento confirmado / vendas confirmadas", () => {
    expect(averageTicket(orders)).toBe(166.67);
  });

  it("ticket médio é zero sem vendas confirmadas", () => {
    expect(averageTicket([{ status: "Novo", total: 100 }, { status: "Cancelado", total: 50 }])).toBe(0);
  });

  it("valor dos pedidos soma todos os status", () => {
    expect(ordersTotal(orders)).toBe(1800);
  });
});

describe("Filtro de período (fuso local)", () => {
  const now = new Date(2026, 10, 18, 14, 30); // 18/11/2026 14:30 local

  it("Hoje vai de 00:00 até o fim do dia atual", () => {
    const r = getDateRange({ preset: "hoje", from: "", to: "" }, now);
    expect(r.fromDay).toBe("2026-11-18");
    expect(r.toDay).toBe("2026-11-18");
    expect(isInRange(new Date(2026, 10, 18, 0, 0), r)).toBe(true);
    expect(isInRange(new Date(2026, 10, 18, 23, 59, 59, 999), r)).toBe(true);
    expect(isInRange(new Date(2026, 10, 17, 23, 59, 59, 999), r)).toBe(false);
    expect(isInRange(new Date(2026, 10, 19, 0, 0), r)).toBe(false);
  });

  it("Últimos 7 dias inclui hoje e os 6 dias anteriores", () => {
    const r = getDateRange({ preset: "7d", from: "", to: "" }, now);
    expect(r.fromDay).toBe("2026-11-12");
    expect(r.toDay).toBe("2026-11-18");
  });

  it("Últimos 30 dias inclui hoje e os 29 dias anteriores", () => {
    const r = getDateRange({ preset: "30d", from: "", to: "" }, now);
    expect(r.fromDay).toBe("2026-10-20");
    expect(r.toDay).toBe("2026-11-18");
  });

  it("Personalizado inclui o dia final inteiro", () => {
    const r = getDateRange({ preset: "custom", from: "2026-11-01", to: "2026-11-10" }, now);
    expect(isInRange(new Date(2026, 10, 1, 0, 0), r)).toBe(true);
    expect(isInRange(new Date(2026, 10, 10, 23, 59, 59), r)).toBe(true);
    expect(isInRange(new Date(2026, 10, 11, 0, 0), r)).toBe(false);
  });

  it("Personalizado com datas invertidas é corrigido", () => {
    const r = getDateRange({ preset: "custom", from: "2026-11-10", to: "2026-11-01" }, now);
    expect([r.fromDay, r.toDay]).toEqual(["2026-11-01", "2026-11-10"]);
  });
});
