import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductDescription } from "@/components/store/ProductDescription";

describe("Descrição Markdown do produto", () => {
  it("renderiza títulos, negrito e itálico", () => {
    const { container } = render(<ProductDescription content={"## ESPECIFICAÇÕES\n\nTexto **importante** e *destaque*."} />);
    expect(screen.getByRole("heading", { name: "ESPECIFICAÇÕES", level: 3 })).toBeInTheDocument();
    expect(container.querySelector("strong")).toHaveTextContent("importante");
    expect(container.querySelector("em")).toHaveTextContent("destaque");
  });

  it("renderiza listas e preserva quebras de linha", () => {
    const { container } = render(<ProductDescription content={"Linha um\nLinha dois\n\n- Item A\n- Item B\n\n1. Primeiro\n2. Segundo"} />);
    expect(container.querySelectorAll("br")).toHaveLength(1);
    expect(container.querySelectorAll("ul li")).toHaveLength(2);
    expect(container.querySelectorAll("ol li")).toHaveLength(2);
  });

  it("não interpreta HTML arbitrário da descrição", () => {
    const { container } = render(<ProductDescription content={'<img src=x onerror="alert(1)" />'} />);
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(container).toHaveTextContent('<img src=x onerror="alert(1)" />');
  });
});
