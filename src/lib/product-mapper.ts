import type { CategorySlug, Product, ProductTag, ProductVariant } from "@/data/catalog";
import type { Database } from "@/integrations/supabase/types";

export type ProductRow = Database["public"]["Tables"]["products"]["Row"];

/** Converte a linha do banco no formato usado pelos componentes da loja. */
export function mapProductRow(row: ProductRow): Product {
  const specs = Array.isArray(row.specs)
    ? (row.specs as unknown[]).filter(
        (s): s is [string, string] => Array.isArray(s) && s.length === 2 && s.every((v) => typeof v === "string"),
      )
    : [];
  return {
    id: row.id,
    slug: row.slug,
    name: row.name.split("*").join("").trim(),
    brand: row.brand,
    sku: row.sku,
    category: row.category as CategorySlug,
    image: row.image_url,
    images: Array.isArray(row.gallery_urls) && row.gallery_urls.length ? row.gallery_urls.filter((url): url is string => typeof url === "string") : [row.image_url].filter(Boolean),
    variants: Array.isArray(row.variants) ? (row.variants as unknown[]).filter((v): v is ProductVariant => !!v && typeof v === "object" && typeof (v as ProductVariant).name === "string" && Array.isArray((v as ProductVariant).options)) : [],
    price: Number(row.price),
    oldPrice: row.old_price != null && Number(row.old_price) > Number(row.price) ? Number(row.old_price) : undefined,
    rating: Number(row.rating),
    reviews: row.reviews,
    badge: row.badge ?? undefined,
    tags: (row.tags ?? []) as ProductTag[],
    short: row.short_description,
    description: row.description,
    specs,
    stock: row.stock,
  };
}
