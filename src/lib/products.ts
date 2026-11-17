import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";

import { listStoreProducts } from "./products.functions";

export { mapProductRow, type ProductRow } from "./product-mapper";

export const productsQueryOptions = queryOptions({
  queryKey: ["store-products"],
  queryFn: () => listStoreProducts(),
  staleTime: 60_000,
});

/** Lista de produtos ativos da loja (já carregada pelo loader da raiz). */
export function useProducts() {
  return useSuspenseQuery(productsQueryOptions).data;
}

/** Versão sem suspense, para provedores que montam antes dos dados. */
export function useProductsMaybe() {
  return useQuery(productsQueryOptions).data;
}
