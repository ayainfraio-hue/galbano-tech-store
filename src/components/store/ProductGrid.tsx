import { useMemo, useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product } from "@/data/catalog";
import { discountPercent } from "@/lib/pricing";
import { ProductCard } from "./ProductCard";

type Sort = "relevancia" | "menor-preco" | "maior-preco" | "desconto";

export function ProductGrid({ products }: { products: Product[] }) {
  const [sort, setSort] = useState<Sort>("relevancia");

  const sorted = useMemo(() => {
    const list = products.slice();
    if (sort === "menor-preco") list.sort((a, b) => a.price - b.price);
    if (sort === "maior-preco") list.sort((a, b) => b.price - a.price);
    if (sort === "desconto")
      list.sort((a, b) => discountPercent(b.price, b.oldPrice) - discountPercent(a.price, a.oldPrice));
    return list;
  }, [products, sort]);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {products.length} {products.length === 1 ? "produto encontrado" : "produtos encontrados"}
        </p>
        <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
          <SelectTrigger className="h-10 w-48 rounded-full border-border bg-secondary" aria-label="Ordenar por">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-border bg-popover">
            <SelectItem value="relevancia">Mais relevantes</SelectItem>
            <SelectItem value="menor-preco">Menor preço</SelectItem>
            <SelectItem value="maior-preco">Maior preço</SelectItem>
            <SelectItem value="desconto">Maior desconto</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {sorted.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </div>
  );
}
