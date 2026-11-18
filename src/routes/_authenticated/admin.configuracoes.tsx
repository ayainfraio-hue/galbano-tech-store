import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader, Panel } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { defaultStoreSettings, type StoreSettings } from "@/lib/store-content";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({ component: SettingsPage });

function SettingsPage() {
  const qc = useQueryClient();
  const settings = useQuery({
    queryKey: ["admin", "store-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("store_settings").select("*").eq("id", "default").single();
      if (error) throw error;
      return data as StoreSettings;
    },
  });
  const [form, setForm] = useState<StoreSettings>(defaultStoreSettings);
  useEffect(() => { if (settings.data) setForm(settings.data); }, [settings.data]);

  const saveSettings = useMutation({
    mutationFn: async () => {
      const phone = form.whatsapp_number.replace(/\D/g, "");
      if (phone.length < 10 || phone.length > 15) throw new Error("Informe o WhatsApp com DDI e DDD, somente números.");
      const { error } = await supabase.from("store_settings").update({ ...form, whatsapp_number: phone }).eq("id", "default");
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Configurações salvas"); qc.invalidateQueries({ queryKey: ["store-settings"] }); qc.invalidateQueries({ queryKey: ["admin", "store-settings"] }); },
    onError: (e: Error) => toast.error(e.message || "Não foi possível salvar"),
  });

  const brands = useQuery({
    queryKey: ["admin", "store-brands"],
    queryFn: async () => { const { data, error } = await supabase.from("store_brands").select("*").order("sort_order"); if (error) throw error; return data; },
  });
  const [newBrand, setNewBrand] = useState("");
  const [brandEdits, setBrandEdits] = useState<Record<string,string>>({});
  const brandMutation = useMutation({
    mutationFn: async (values: {id?:string; name:string; active?:boolean; remove?:boolean}) => {
      if (values.remove && values.id) { const {error}=await supabase.from("store_brands").delete().eq("id",values.id); if(error) throw error; return; }
      if (values.id) { const {error}=await supabase.from("store_brands").update({name:values.name,active:values.active}).eq("id",values.id); if(error) throw error; }
      else { const {error}=await supabase.from("store_brands").insert({name:values.name,sort_order:(brands.data?.length ?? 0)+1}); if(error) throw error; }
    },
    onSuccess: () => { toast.success("Marcas atualizadas"); qc.invalidateQueries({queryKey:["admin","store-brands"]}); qc.invalidateQueries({queryKey:["store-brands"]}); setNewBrand(""); },
    onError: () => toast.error("Não foi possível atualizar a marca"),
  });

  const gallery = useQuery({
    queryKey: ["admin", "customer-gallery"],
    queryFn: async () => { const {data,error}=await supabase.from("customer_gallery").select("*").order("sort_order").order("created_at",{ascending:false}); if(error) throw error; return data; },
  });
  const [customerName,setCustomerName]=useState("");
  const [message,setMessage]=useState("");
  const [photo,setPhoto]=useState<File|null>(null);
  const uploadGallery = useMutation({
    mutationFn: async () => {
      if (!photo) throw new Error("Selecione uma foto.");
      if (!photo.type.startsWith("image/") || photo.size > 10*1024*1024) throw new Error("Use uma imagem de até 10 MB.");
      const ext=photo.name.split(".").pop()?.toLowerCase() || "jpg";
      const path=`${crypto.randomUUID()}.${ext}`;
      const {error:uploadError}=await supabase.storage.from("customer-gallery").upload(path,photo,{contentType:photo.type,upsert:false});
      if(uploadError) throw uploadError;
      const {data}=supabase.storage.from("customer-gallery").getPublicUrl(path);
      const {error}=await supabase.from("customer_gallery").insert({customer_name:customerName.trim()||"Cliente",message:message.trim(),image_url:data.publicUrl,sort_order:(gallery.data?.length??0)+1});
      if(error) { await supabase.storage.from("customer-gallery").remove([path]); throw error; }
    },
    onSuccess:()=>{toast.success("Depoimento adicionado à galeria");setCustomerName("");setMessage("");setPhoto(null);qc.invalidateQueries({queryKey:["admin","customer-gallery"]});qc.invalidateQueries({queryKey:["customer-gallery"]});},
    onError:(e:Error)=>toast.error(e.message||"Falha ao enviar imagem"),
  });
  const galleryAction=useMutation({
    mutationFn:async (item:{id:string;active?:boolean;remove?:boolean})=>{
      const {error}=item.remove?await supabase.from("customer_gallery").delete().eq("id",item.id):await supabase.from("customer_gallery").update({active:item.active}).eq("id",item.id);
      if(error) throw error;
    },
    onSuccess:()=>{qc.invalidateQueries({queryKey:["admin","customer-gallery"]});qc.invalidateQueries({queryKey:["customer-gallery"]});toast.success("Galeria atualizada");},
    onError:()=>toast.error("Não foi possível atualizar a galeria"),
  });

  function submitSettings(e:FormEvent){e.preventDefault();saveSettings.mutate();}
  return <>
    <PageHeader title="Configurações" description="Edite as informações comerciais, marcas parceiras e depoimentos exibidos na loja." />
    <Panel className="p-5 sm:p-6">
      <form onSubmit={submitSettings} className="space-y-5">
        <div><h2 className="text-lg font-semibold">WhatsApp e pedidos</h2><p className="text-sm text-muted-foreground">Contato comercial e avisos exibidos no topo da loja.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Número comercial do WhatsApp" hint="Com DDI e DDD, somente números. Ex.: 5511999999999"><Input value={form.whatsapp_number} onChange={e=>setForm({...form,whatsapp_number:e.target.value.replace(/\D/g,"")})} placeholder="5511999999999" inputMode="numeric" /></Field>
          <Field label="Alerta de estoque baixo (unidades)" hint="Limite padrão usado para identificar estoque baixo"><Input type="number" min="0" value={form.low_stock_threshold} onChange={e=>setForm({...form,low_stock_threshold:Number(e.target.value)})}/></Field>
          <Field label="Aviso no topo da loja · 1"><Input value={form.top_notice_1} onChange={e=>setForm({...form,top_notice_1:e.target.value})} maxLength={120}/></Field>
          <Field label="Aviso no topo da loja · 2" hint="Será exibido alternadamente com o primeiro aviso."><Input value={form.top_notice_2} onChange={e=>setForm({...form,top_notice_2:e.target.value})} maxLength={120}/></Field>
        </div>
        <div className="border-t border-border pt-5"><h2 className="text-lg font-semibold">Informações da loja</h2></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome da loja"><Input value={form.store_name} onChange={e=>setForm({...form,store_name:e.target.value})}/></Field>
          <Field label="E-mail"><Input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></Field>
          <Field label="Instagram"><Input value={form.instagram} onChange={e=>setForm({...form,instagram:e.target.value})} placeholder="@sualoja ou URL"/></Field>
          <Field label="Horário de atendimento"><Input value={form.business_hours} onChange={e=>setForm({...form,business_hours:e.target.value})} placeholder="Seg a sex, das 9h às 18h"/></Field>
          <div className="sm:col-span-2"><Field label="Endereço / cidade"><Input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Cidade - UF ou endereço completo"/></Field></div>
        </div>
        <div className="flex justify-end"><Button variant="gold" type="submit" disabled={saveSettings.isPending}><Save/> {saveSettings.isPending?"Salvando…":"Salvar configurações"}</Button></div>
      </form>
    </Panel>

    <Panel className="mt-6 p-5 sm:p-6">
      <div className="mb-4"><h2 className="text-lg font-semibold">Parceiros · As melhores marcas</h2><p className="text-sm text-muted-foreground">Adicione, renomeie, oculte ou remova marcas. Cada marca abre a busca correspondente.</p></div>
      <form className="mb-4 flex gap-2" onSubmit={e=>{e.preventDefault();if(newBrand.trim())brandMutation.mutate({name:newBrand.trim()});}}>
        <Input value={newBrand} onChange={e=>setNewBrand(e.target.value)} placeholder="Nome da nova marca"/>
        <Button type="submit" variant="gold" disabled={!newBrand.trim()||brandMutation.isPending}><Plus/> Adicionar</Button>
      </form>
      {brands.isLoading?<EmptyState>Carregando marcas…</EmptyState>:<ul className="divide-y divide-border">
        {(brands.data??[]).map(b=><li key={b.id} className="flex flex-wrap items-center gap-2 py-3">
          <Input className="min-w-0 flex-1" value={brandEdits[b.id]??b.name} onChange={e=>setBrandEdits({...brandEdits,[b.id]:e.target.value})}/>
          <Button size="sm" variant="outline-gold" onClick={()=>brandMutation.mutate({id:b.id,name:(brandEdits[b.id]??b.name).trim(),active:b.active})}>Salvar</Button>
          <Button size="sm" variant="outline" onClick={()=>brandMutation.mutate({id:b.id,name:b.name,active:!b.active})}>{b.active?"Ocultar":"Exibir"}</Button>
          <Button size="icon" variant="ghost" className="text-destructive" onClick={()=>brandMutation.mutate({id:b.id,name:b.name,remove:true})} aria-label={`Remover ${b.name}`}><Trash2/></Button>
        </li>)}
      </ul>}
    </Panel>

    <Panel className="mt-6 p-5 sm:p-6">
      <div className="mb-4"><h2 className="text-lg font-semibold">Galeria de clientes</h2><p className="text-sm text-muted-foreground">Adicione fotos e depoimentos. Eles aparecem em carrossel na loja e abrem em uma janela ao clicar.</p></div>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();uploadGallery.mutate();}}>
        <Field label="Nome do cliente"><Input value={customerName} onChange={e=>setCustomerName(e.target.value)} placeholder="Ex.: Maria"/></Field>
        <Field label="Foto do cliente / produto"><Input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setPhoto(e.target.files?.[0]??null)}/></Field>
        <div className="sm:col-span-2"><Field label="Mensagem completa"><Textarea rows={3} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Escreva ou cole o depoimento autorizado pelo cliente."/></Field></div>
        <div className="sm:col-span-2 flex justify-end"><Button variant="gold" type="submit" disabled={!photo||!message.trim()||uploadGallery.isPending}><ImagePlus/> {uploadGallery.isPending?"Enviando…":"Adicionar à galeria"}</Button></div>
      </form>
      <div className="mt-5">
        {(gallery.data??[]).length===0?<EmptyState>{gallery.isLoading?"Carregando…":"Nenhum depoimento cadastrado."}</EmptyState>:<ul className="grid gap-3 sm:grid-cols-2">
          {(gallery.data??[]).map(item=><li key={item.id} className="flex gap-3 rounded-xl border border-border p-3">
            <img src={item.image_url} alt="" className="h-20 w-20 rounded-lg object-cover"/>
            <div className="min-w-0 flex-1"><p className="font-semibold">{item.customer_name}</p><p className="line-clamp-2 text-xs text-muted-foreground">{item.message}</p><div className="mt-2 flex gap-2"><Button size="sm" variant="outline" onClick={()=>galleryAction.mutate({id:item.id,active:!item.active})}>{item.active?"Ocultar":"Exibir"}</Button><Button size="sm" variant="ghost" className="text-destructive" onClick={()=>galleryAction.mutate({id:item.id,remove:true})}><Trash2/> Excluir</Button></div></div>
          </li>)}
        </ul>}
      </div>
    </Panel>
  </>;
}

function Field({label,hint,children}:{label:string;hint?:string;children:ReactNode}){
  return <div className="space-y-1.5"><Label>{label}</Label>{children}{hint&&<p className="text-xs text-muted-foreground">{hint}</p>}</div>;
}
