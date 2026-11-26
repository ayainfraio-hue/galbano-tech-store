import type { CategorySlug, Product, ProductTag } from "@/data/catalog";
import type { Database } from "@/integrations/supabase/types";

export type ProductRow = Database["public"]["Tables"]["products"]["Row"];

/** Converte a linha do banco no formato usado pelos componentes da loja. */
export type ProductListRow = Omit<ProductRow, "gallery_urls">;

export function mapProductRow(row: ProductRow | ProductListRow): Product {
  const galleryImages = "gallery_urls" in row && Array.isArray(row.gallery_urls)
    ? row.gallery_urls.filter((value): value is string => typeof value === "string")
    : [];
  const specs = Array.isArray(row.specs)
    ? (row.specs as unknown[]).filter(
        (s): s is [string, string] => Array.isArray(s) && s.length === 2 && s.every((v) => typeof v === "string"),
      )
    : [];
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    sku: row.sku,
    category: row.category as CategorySlug,
    image: row.image_url,
    images: [...new Set([row.image_url, ...galleryImages])],
    price: Number(row.price),
    oldPrice: row.old_price != null && Number(row.old_price) > Number(row.price) ? Number(row.old_price) : undefined,
    rating: Number(row.rating),
    reviews: row.rating_count,
    badge: row.badge ?? undefined,
    tags: (row.tags ?? []) as ProductTag[],
    short: row.short_description,
    description: row.description,
    specs,
    stock: row.stock,
  };
}
