import smartphone from "@/assets/products/smartphone.jpg";
import notebook from "@/assets/products/notebook.jpg";
import headphone from "@/assets/products/headphone.jpg";
import smartwatch from "@/assets/products/smartwatch.jpg";
import smartTv from "@/assets/products/smart-tv.jpg";
import tablet from "@/assets/products/tablet.jpg";
import teclado from "@/assets/products/teclado-mecanico.jpg";
import drone from "@/assets/products/drone.jpg";
import consoleImg from "@/assets/products/console.jpg";

export type CategorySlug =
  | "smartphones"
  | "notebooks"
  | "audio"
  | "smartwatches"
  | "tv-e-video"
  | "games"
  | "perifericos"
  | "tablets"
  | "drones";

export interface Category {
  slug: CategorySlug;
  name: string;
  image: string;
}

export type ProductTag = "oferta" | "destaque" | "mais-vendido" | "lancamento";

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  sku: string;
  category: CategorySlug;
  image: string;
  /** Preço de venda. */
  price: number;
  oldPrice?: number | undefined;
  rating: number;
  reviews: number;
  badge?: string | undefined;
  tags: ProductTag[];
  short: string;
  description: string;
  specs: [string, string][];
  stock: number;
}

export const categories: Category[] = [
  { slug: "smartphones", name: "Smartphones", image: smartphone },
  { slug: "notebooks", name: "Notebooks", image: notebook },
  { slug: "audio", name: "Áudio", image: headphone },
  { slug: "smartwatches", name: "Smartwatches", image: smartwatch },
  { slug: "tv-e-video", name: "TV e Vídeo", image: smartTv },
  { slug: "games", name: "Games", image: consoleImg },
  { slug: "perifericos", name: "Periféricos", image: teclado },
  { slug: "tablets", name: "Tablets", image: tablet },
  { slug: "drones", name: "Drones", image: drone },
];

export const brands = ["Aurum", "Nexa", "Voltix", "Pulse", "Orbit", "Kairo", "Lumen", "Vertex"];

export const productTags: { value: ProductTag; label: string }[] = [
  { value: "oferta", label: "Oferta" },
  { value: "destaque", label: "Destaque" },
  { value: "mais-vendido", label: "Mais vendido" },
  { value: "lancamento", label: "Lançamento" },
];

// Os produtos vêm do banco de dados (ver src/lib/products.ts); estes helpers recebem a lista carregada.
export function getProduct(list: Product[], slug: string) {
  return list.find((p) => p.slug === slug);
}

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export function productsByTag(list: Product[], tag: ProductTag) {
  return list.filter((p) => p.tags.includes(tag));
}

export function productsByCategory(list: Product[], slug: CategorySlug) {
  return list.filter((p) => p.category === slug);
}

export function searchProducts(list: Product[], query: string) {
  const q = normalize(query);
  if (!q) return list;
  return list.filter((p) =>
    normalize(`${p.name} ${p.brand} ${p.sku} ${getCategory(p.category)?.name ?? ""}`).includes(q),
  );
}

export function slugify(value: string) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
