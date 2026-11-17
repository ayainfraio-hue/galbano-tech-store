import { describe, expect, it } from "vitest";

import { buildOrderMessage, orderTotals, whatsappUrl, WHATSAPP_NUMBER } from "@/lib/whatsapp";

const lines = [
  { name: "Smartphone Aurum X Pro", sku: "GT-1001", price: 5499, quantity: 2 },
  { name: "Mouse Gamer Vertex M9", sku: "GT-7003", price: 279.9, quantity: 1 },
];

describe("Pedido pelo WhatsApp", () => {
  it("usa o WhatsApp comercial +55 62 9264-3627", () => {
    expect(WHATSAPP_NUMBER).toBe("556292643627");
    expect(whatsappUrl("oi")).toBe("https://wa.me/556292643627?text=oi");
  });

  it("soma o total considerando as quantidades", () => {
    expect(orderTotals(lines)).toEqual({ total: 11277.9, items: 3 });
  });

  it("a mensagem lista produtos, quantidades e o valor total", () => {
    const msg = buildOrderMessage(lines);
    expect(msg).toContain("Smartphone Aurum X Pro");
    expect(msg).toContain("Qtd: 2");
    expect(msg).toContain("Mouse Gamer Vertex M9");
    expect(msg).toContain("Qtd: 1");
    expect(msg).toContain("Total: R$ 11.277,90");
  });

  it("não exibe condições de pagamento (só o preço)", () => {
    const msg = buildOrderMessage(lines);
    expect(msg).not.toMatch(/pix/i);
    expect(msg).not.toMatch(/sem juros/i);
  });
});
