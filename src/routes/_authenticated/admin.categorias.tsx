import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Eye, EyeOff, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader, Panel } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/data/catalog";

type Category = { id: string; name: string; slug: string; image_url: string | null; active: boolean; sort_order: number };

export const Route = createFileRoute("/_authenticated/admin/categorias")({ component: CategoriesPage });

function CategoriesPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [editing, setEditing] = useState<Record<string, Partial<Category>>>({});

  const categories = useQuery({
    queryKey: ["admin", "store-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("store_categories").select("*").order("sort_order").order("name");
      if (error) throw error;
      return data as Category[];
    },
  });

  const save = useMutation({
    mutationFn: async (value: { id?: string; name: string; slug: string; active?: boolean; sort_order?: number; remove?: boolean }) => {
      if (value.remove && value.id) {
        const { count, error: countError } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category", value.slug);
        if (countError) throw countError;
        if ((count ?? 0) > 0) throw new Error("Esta categoria possui produtos vinculados. Reatribua os produtos antes de excluí-la.");
        const { error } = await supabase.from("store_categories").delete().eq("id", value.id);
        if (error) throw error;
        return;
      }
      const payload = { name: value.name.trim(), slug: value.slug.trim(), active: value.active ?? true, sort_order: value.sort_order ?? (categories.data?.length ?? 0) + 1 };
      const { error } = value.id
        ? await supabase.from("store_categories").update(payload).eq("id", value.id)
        : await supabase.from("store_categories").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categorias atualizadas");
      qc.invalidateQueries({ queryKey: ["admin", "store-categories"] });
      qc.invalidateQueries({ queryKey: ["store-categories"] });
      setName(""); setSlug(""); setEditing({});
    },
    onError: (error: Error) => toast.error(error.message || "Não foi possível salvar a categoria"),
  });

  return <>
    <PageHeader title="Categorias" description="Organize as categorias exibidas na loja e usadas no cadastro dos produtos." actions={<span className="text-sm text-muted-foreground">{categories.data?.length ?? 0} categorias</span>} />
    <Panel className="mb-5 p-5 sm:p-6">
      <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={(e) => { e.preventDefault(); if (name.trim() && slug.trim()) save.mutate({ name, slug }); }}>
        <div className="space-y-1.5"><Label htmlFor="category-name">Nome da categoria</Label><Input id="category-name" value={name} onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)); }} placeholder="Ex.: Acessórios" maxLength={80} /></div>
        <div className="space-y-1.5"><Label htmlFor="category-slug">Endereço (slug)</Label><Input id="category-slug" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="acessorios" maxLength={80} /></div>
        <Button type="submit" variant="gold" className="self-end" disabled={!name.trim() || !slug.trim() || save.isPending}><Plus /> Adicionar</Button>
      </form>
    </Panel>
    <Panel className="p-4 sm:p-6">
      {categories.isLoading ? <EmptyState>Carregando categorias…</EmptyState> : categories.isError ? <EmptyState>Não foi possível carregar as categorias.</EmptyState> : !categories.data?.length ? <EmptyState>Nenhuma categoria cadastrada.</EmptyState> :
        <ul className="divide-y divide-slate-100">
          {categories.data.map((category) => {
            const value = { ...category, ...editing[category.id] };
            return <li key={category.id} className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_90px_auto] md:items-end">
              <div className="space-y-1.5"><Label>Nome</Label><Input value={value.name ?? ""} onChange={(e) => setEditing((old) => ({ ...old, [category.id]: { ...old[category.id], name: e.target.value, slug: old[category.id]?.slug ?? category.slug } }))} /></div>
              <div className="space-y-1.5"><Label>Slug</Label><Input value={value.slug ?? ""} onChange={(e) => setEditing((old) => ({ ...old, [category.id]: { ...old[category.id], slug: slugify(e.target.value) } }))} /></div>
              <div className="space-y-1.5"><Label>Ordem</Label><Input type="number" min={0} value={value.sort_order ?? 0} onChange={(e) => setEditing((old) => ({ ...old, [category.id]: { ...old[category.id], sort_order: Number(e.target.value) } }))} /></div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => save.mutate({ id: category.id, name: value.name ?? category.name, slug: value.slug ?? category.slug, active: value.active, sort_order: value.sort_order })}><Save /> Salvar</Button>
                <Button size="sm" variant="outline" onClick={() => save.mutate({ id: category.id, name: category.name, slug: category.slug, active: !category.active, sort_order: category.sort_order })}>{category.active ? <><EyeOff /> Ocultar</> : <><Eye /> Exibir</>}</Button>
                <Button size="icon" variant="ghost" className="text-red-600" aria-label={`Excluir ${category.name}`} onClick={() => { if (confirm(`Excluir a categoria ${category.name}?`)) save.mutate({ id: category.id, name: category.name, slug: category.slug, remove: true }); }}><Trash2 /></Button>
              </div>
              <p className="text-xs text-muted-foreground md:col-span-4">{category.active ? "Visível" : "Oculta"} na loja · /categoria/{category.slug}</p>
            </li>;
          })}
        </ul>}
    </Panel>
  </>;
}
