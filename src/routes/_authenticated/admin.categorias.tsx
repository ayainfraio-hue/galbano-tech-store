import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Plus, Save, Trash2, Upload } from "lucide-react";
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
  const [editing, setEditing] = useState<Record<string, Partial<Category>>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const categories = useQuery({
    queryKey: ["admin", "store-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("store_categories").select("*").order("sort_order").order("name");
      if (error) throw error;
      return data as Category[];
    },
  });

  async function uploadCategoryImage(category: Category, file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Use uma imagem JPG, PNG ou WebP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 10 MB.");
      return;
    }
    setUploadingId(category.id);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `category-images/${category.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("customer-gallery").upload(path, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) throw new Error(`Não foi possível enviar a imagem: ${uploadError.message}`);
      const imageUrl = supabase.storage.from("customer-gallery").getPublicUrl(path).data.publicUrl;
      const { error: updateError } = await supabase.from("store_categories").update({ image_url: imageUrl }).eq("id", category.id);
      if (updateError) throw updateError;
      toast.success(`Foto de ${category.name} atualizada.`);
      await qc.invalidateQueries({ queryKey: ["admin", "store-categories"] });
      await qc.invalidateQueries({ queryKey: ["store-categories"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a imagem.");
    } finally {
      setUploadingId(null);
    }
  }

  const save = useMutation({
    mutationFn: async (value: { id?: string; name: string; slug?: string; active?: boolean; sort_order?: number; remove?: boolean }) => {
      if (value.remove && value.id) {
        const category = categories.data?.find((item) => item.id === value.id);
        const { count, error: countError } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category", category?.slug ?? "");
        if (countError) throw countError;
        if ((count ?? 0) > 0) throw new Error("Esta categoria possui produtos vinculados. Reatribua os produtos antes de excluí-la.");
        const { error } = await supabase.from("store_categories").delete().eq("id", value.id);
        if (error) throw error;
        return;
      }
      const current = value.id ? categories.data?.find((item) => item.id === value.id) : undefined;
      const payload = {
        name: value.name.trim(),
        slug: value.slug ?? current?.slug ?? slugify(value.name),
        active: value.active ?? current?.active ?? true,
        sort_order: value.sort_order ?? current?.sort_order ?? (categories.data?.length ?? 0) + 1,
      };
      const { error } = value.id
        ? await supabase.from("store_categories").update(payload).eq("id", value.id)
        : await supabase.from("store_categories").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categorias atualizadas");
      qc.invalidateQueries({ queryKey: ["admin", "store-categories"] });
      qc.invalidateQueries({ queryKey: ["store-categories"] });
      setName("");
      setEditing({});
    },
    onError: (error: Error) => toast.error(error.message || "Não foi possível salvar a categoria"),
  });

  return <>
    <PageHeader title="Categorias" description="Gerencie as categorias da sua loja." actions={<span className="text-sm text-muted-foreground">{categories.data?.length ?? 0} categorias</span>} />
    <Panel className="mb-4 p-4 sm:p-5">
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) save.mutate({ name }); }}>
        <div className="min-w-0 flex-1">
          <Label htmlFor="category-name" className="sr-only">Nome da categoria</Label>
          <Input id="category-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da nova categoria" maxLength={80} />
        </div>
        <Button type="submit" variant="gold" disabled={!name.trim() || save.isPending}><Plus /> Adicionar</Button>
      </form>
    </Panel>
    <Panel className="p-3 sm:p-4">
      {categories.isLoading ? <EmptyState>Carregando categorias…</EmptyState> : categories.isError ? <EmptyState>Não foi possível carregar as categorias.</EmptyState> : !categories.data?.length ? <EmptyState>Nenhuma categoria cadastrada.</EmptyState> :
        <ul className="divide-y divide-slate-100">
          {categories.data.map((category) => {
            const value = { ...category, ...editing[category.id] };
            const changed = value.name !== category.name || value.sort_order !== category.sort_order;
            return <li key={category.id} className="flex flex-wrap items-center gap-2 py-3 first:pt-1 last:pb-1">
              <div className="min-w-0 flex-1">
                <Label htmlFor={`category-${category.id}`} className="sr-only">Nome da categoria</Label>
                <Input id={`category-${category.id}`} value={value.name} onChange={(e) => setEditing((old) => ({ ...old, [category.id]: { ...old[category.id], name: e.target.value } }))} className="h-9 border-transparent bg-transparent px-2 font-medium shadow-none hover:border-input focus-visible:border-input focus-visible:bg-white" />
              </div>
              <div className="w-20">
                <Label htmlFor={`order-${category.id}`} className="sr-only">Ordem</Label>
                <Input id={`order-${category.id}`} aria-label="Ordem de exibição" type="number" min={0} value={value.sort_order} onChange={(e) => setEditing((old) => ({ ...old, [category.id]: { ...old[category.id], sort_order: Number(e.target.value) } }))} className="h-9 text-center" />
              </div>
              {changed && <Button size="icon" variant="outline" className="h-9 w-9" aria-label={`Salvar ${category.name}`} onClick={() => save.mutate({ id: category.id, name: value.name, sort_order: value.sort_order })}><Save className="h-4 w-4" /></Button>}
              <Button size="sm" variant="outline" className="h-9 min-w-[76px] px-3 text-xs" aria-label={category.active ? `Categoria ativa. Clique para ocultar ${category.name}` : `Categoria oculta. Clique para ativar ${category.name}`} onClick={() => save.mutate({ id: category.id, name: category.name, active: !category.active })}>{category.active ? "Ativa" : "Oculta"}</Button>
              <Button size="icon" variant="ghost" className="h-9 w-9 text-red-600 hover:text-red-700" aria-label={`Excluir ${category.name}`} onClick={() => { if (confirm(`Excluir a categoria ${category.name}?`)) save.mutate({ id: category.id, name: category.name, remove: true }); }}><Trash2 className="h-4 w-4" /></Button>
            </li>;
          })}
        </ul>}
    </Panel>
    <p className="mt-3 text-xs text-muted-foreground">O endereço da categoria é criado automaticamente. A ordem define como elas aparecem na loja. As fotos aceitam JPG, PNG ou WebP, até 10 MB.</p>
  </>;
}
