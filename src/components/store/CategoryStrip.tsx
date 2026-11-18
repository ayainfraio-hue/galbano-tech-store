import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { categories as fallbackCategories, getCategory } from "@/data/catalog";
import { supabase } from "@/integrations/supabase/client";

export function CategoryStrip() {
  const categories = useQuery({
    queryKey: ["store-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("store_categories").select("name,slug,image_url").eq("active", true).order("sort_order");
      if (error) throw error;
      return data;
    },
  });
  const items = categories.data?.map((category) => ({
    ...category,
    image: category.image_url || getCategory(category.slug)?.image || "",
  })) ?? fallbackCategories;

  return (
    <section aria-label="Categorias" className="container-store">
      <div className="scrollbar-none -mx-4 overflow-x-auto px-4 py-3">
        <ul className="flex w-max gap-4 sm:gap-5 lg:w-full lg:justify-between">
          {items.map((category) => (
            <li key={category.slug}>
              <Link to="/categoria/$slug" params={{ slug: category.slug }} className="group flex w-24 flex-col items-center gap-2 sm:w-28">
                <span className="grid aspect-square w-full place-items-center overflow-hidden rounded-2xl border border-border bg-surface p-3 transition group-hover:-translate-y-1 group-hover:ring-2 group-hover:ring-gold">
                  {category.image ? <img src={category.image} alt="" loading="lazy" className="h-full w-full object-contain" /> : <span className="text-2xl text-muted-foreground">{category.name.slice(0,1)}</span>}
                </span>
                <span className="text-center text-xs font-medium text-muted-foreground transition group-hover:text-gold sm:text-sm">{category.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
