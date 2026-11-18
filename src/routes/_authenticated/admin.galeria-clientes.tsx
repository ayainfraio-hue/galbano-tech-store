import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader, Panel } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

type GalleryItem = {
  id: string;
  customer_name: string;
  message: string;
  image_url: string;
  active: boolean;
  sort_order: number;
};

export const Route = createFileRoute("/_authenticated/admin/galeria-clientes")({ component: CustomerGalleryPage });

function CustomerGalleryPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [editing, setEditing] = useState<GalleryItem | null>(null);

  useEffect(() => {
    if (!photo) { setPreview(""); return; }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const gallery = useQuery({
    queryKey: ["admin", "customer-gallery"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customer_gallery").select("*").order("sort_order").order("created_at", { ascending: false });
      if (error) throw error;
      return data as GalleryItem[];
    },
  });

  function resetForm() {
    setName(""); setDescription(""); setPhoto(null); setPreview(""); setEditing(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function startEdit(item: GalleryItem) {
    setEditing(item); setName(item.customer_name); setDescription(item.message); setPhoto(null); setPreview(item.image_url);
    if (fileRef.current) fileRef.current.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Informe o nome do cliente.");
      if (!description.trim()) throw new Error("Escreva uma descrição ou depoimento.");
      if (!editing && !photo) throw new Error("Selecione uma foto para continuar.");
      let imageUrl = editing?.image_url ?? "";
      if (photo) {
        if (!photo.type.startsWith("image/")) throw new Error("Selecione um arquivo de imagem válido.");
        if (photo.size > 10 * 1024 * 1024) throw new Error("A foto deve ter no máximo 10 MB.");
        const ext = photo.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("customer-gallery").upload(path, photo, { contentType: photo.type, upsert: false });
        if (uploadError) throw new Error(`Não foi possível enviar a foto: ${uploadError.message}`);
        imageUrl = supabase.storage.from("customer-gallery").getPublicUrl(path).data.publicUrl;
      }
      const payload = { customer_name: name.trim(), message: description.trim(), image_url: imageUrl };
      const result = editing
        ? await supabase.from("customer_gallery").update(payload).eq("id", editing.id)
        : await supabase.from("customer_gallery").insert({ ...payload, sort_order: (gallery.data?.length ?? 0) + 1 });
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      toast.success(editing ? "Cliente atualizado" : "Cliente adicionado à galeria");
      resetForm();
      qc.invalidateQueries({ queryKey: ["admin", "customer-gallery"] });
      qc.invalidateQueries({ queryKey: ["customer-gallery"] });
    },
    onError: (error: Error) => toast.error(error.message || "Não foi possível salvar o cliente."),
  });

  const action = useMutation({
    mutationFn: async (item: { id: string; active?: boolean; remove?: boolean }) => {
      const result = item.remove
        ? await supabase.from("customer_gallery").delete().eq("id", item.id)
        : await supabase.from("customer_gallery").update({ active: item.active }).eq("id", item.id);
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      toast.success("Galeria atualizada");
      qc.invalidateQueries({ queryKey: ["admin", "customer-gallery"] });
      qc.invalidateQueries({ queryKey: ["customer-gallery"] });
    },
    onError: (error: Error) => toast.error(error.message || "Não foi possível atualizar a galeria."),
  });

  function submit(event: FormEvent) { event.preventDefault(); save.mutate(); }

  return <>
    <PageHeader title="Galeria de clientes" description="Cadastre fotos e histórias de clientes para exibir na vitrine da loja." />
    <Panel className="mb-7 p-5 sm:p-7">
      <div className="mb-6 flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700"><ImagePlus className="h-5 w-5"/></div>
        <div><h2 className="font-semibold text-slate-900">{editing ? "Editar publicação" : "Nova publicação"}</h2><p className="text-sm text-slate-500">Adicione o nome, uma descrição e uma foto. A imagem terá uma prévia antes de salvar.</p></div>
      </div>
      <form onSubmit={submit} className="grid gap-5 md:grid-cols-[minmax(0,1fr)_240px]">
        <div className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="customer-name">Nome do cliente</Label><Input id="customer-name" value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: Maria S." maxLength={100}/></div>
          <div className="space-y-1.5"><Label htmlFor="customer-description">Descrição / depoimento</Label><Textarea id="customer-description" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Conte como foi a experiência do cliente com a Gálbano Tech..." rows={5} maxLength={1200}/><p className="text-right text-xs text-slate-400">{description.length}/1200</p></div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" variant="gold" disabled={save.isPending}>{save.isPending ? <><Upload className="animate-pulse"/> Enviando…</> : <><Plus/> {editing ? "Salvar alterações" : "Adicionar à galeria"}</>}</Button>
            {editing && <Button type="button" variant="outline" onClick={resetForm}><X/> Cancelar edição</Button>}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Foto do cliente ou produto</Label>
          <button type="button" onClick={()=>fileRef.current?.click()} className="group flex min-h-[210px] w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-amber-500 hover:bg-amber-50/40">
            {preview ? <img src={preview} alt="Prévia da foto selecionada" className="h-[210px] w-full object-cover"/> : <><Upload className="mb-2 h-7 w-7 text-slate-400 group-hover:text-amber-700"/><span className="text-sm font-medium text-slate-700">Selecionar foto</span><span className="mt-1 text-xs text-slate-400">JPG, PNG ou WebP · até 10 MB</span></>}
          </button>
          {preview && <Button type="button" variant="outline" size="sm" className="w-full" onClick={()=>{setPhoto(null);setPreview(editing?.image_url ?? "");if(fileRef.current)fileRef.current.value="";}}>Trocar foto</Button>}
          <input ref={fileRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setPhoto(e.target.files?.[0]??null)} />
        </div>
      </form>
    </Panel>

    <div className="mb-3 flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">Publicações cadastradas</h2><p className="text-sm text-slate-500">{gallery.data?.length ?? 0} registros</p></div></div>
    <Panel>
      {gallery.isLoading ? <EmptyState>Carregando galeria…</EmptyState> : gallery.isError ? <EmptyState>Não foi possível carregar a galeria. Atualize a página e tente novamente.</EmptyState> : !gallery.data?.length ? <EmptyState>Nenhum cliente cadastrado. Use o formulário acima para adicionar o primeiro.</EmptyState> :
        <ul className="divide-y divide-slate-100">
          {gallery.data.map(item=><li key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <img src={item.image_url} alt={item.customer_name} className="h-24 w-full rounded-lg bg-slate-100 object-cover sm:w-28"/>
            <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="font-semibold text-slate-900">{item.customer_name}</p><span className={item.active?"rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700":"rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500"}>{item.active?"Visível na loja":"Oculto"}</span></div><p className="mt-1 line-clamp-2 text-sm text-slate-500">{item.message}</p></div>
            <div className="flex shrink-0 gap-2"><Button size="sm" variant="outline" onClick={()=>startEdit(item)}><Pencil/> Editar</Button><Button size="sm" variant="outline" onClick={()=>action.mutate({id:item.id,active:!item.active})}>{item.active?"Ocultar":"Exibir"}</Button><Button size="icon" variant="ghost" className="text-red-600 hover:text-red-700" onClick={()=>{if(confirm("Excluir esta publicação da galeria?"))action.mutate({id:item.id,remove:true});}} aria-label={`Excluir ${item.customer_name}`}><Trash2/></Button></div>
          </li>)}
        </ul>}
    </Panel>
  </>;
}
