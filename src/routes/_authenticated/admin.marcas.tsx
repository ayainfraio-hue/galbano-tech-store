import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader, Panel } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/marcas")({ component: BrandsPage });

function BrandsPage() {
  const qc=useQueryClient();
  const [newBrand,setNewBrand]=useState("");
  const [edits,setEdits]=useState<Record<string,string>>({});
  const brands=useQuery({queryKey:["admin","store-brands"],queryFn:async()=>{const {data,error}=await supabase.from("store_brands").select("*").order("sort_order");if(error)throw error;return data;}});
  const mutation=useMutation({
    mutationFn:async(v:{id?:string;name:string;active?:boolean;remove?:boolean})=>{
      if(v.remove&&v.id){const {error}=await supabase.from("store_brands").delete().eq("id",v.id);if(error)throw error;return;}
      if(v.id){const {error}=await supabase.from("store_brands").update({name:v.name,active:v.active}).eq("id",v.id);if(error)throw error;}
      else {const {error}=await supabase.from("store_brands").insert({name:v.name,sort_order:(brands.data?.length??0)+1});if(error)throw error;}
    },
    onSuccess:()=>{toast.success("Marcas atualizadas");qc.invalidateQueries({queryKey:["admin","store-brands"]});qc.invalidateQueries({queryKey:["store-brands"]});setNewBrand("");},
    onError:(e:Error)=>toast.error(e.message||"Não foi possível atualizar a marca"),
  });
  return <>
    <PageHeader title="Marcas parceiras" description="Gerencie as marcas exibidas na vitrine da Gálbano Tech."/>
    <Panel className="p-5 sm:p-7">
      <form className="mb-5 flex flex-col gap-2 sm:flex-row" onSubmit={e=>{e.preventDefault();if(newBrand.trim())mutation.mutate({name:newBrand.trim()});}}>
        <Input value={newBrand} onChange={e=>setNewBrand(e.target.value)} placeholder="Nome da nova marca"/>
        <Button type="submit" variant="gold" disabled={!newBrand.trim()||mutation.isPending}><Plus/> Adicionar marca</Button>
      </form>
      {brands.isLoading?<EmptyState>Carregando marcas…</EmptyState>:brands.isError?<EmptyState>Não foi possível carregar as marcas.</EmptyState>:!brands.data?.length?<EmptyState>Nenhuma marca cadastrada.</EmptyState>:
        <ul className="divide-y divide-slate-100">{brands.data.map(b=><li key={b.id} className="flex flex-wrap items-center gap-2 py-3">
          <Input className="min-w-0 flex-1" value={edits[b.id]??b.name} onChange={e=>setEdits({...edits,[b.id]:e.target.value})}/>
          <Button size="sm" variant="outline" onClick={()=>mutation.mutate({id:b.id,name:(edits[b.id]??b.name).trim(),active:b.active})}><Save/> Salvar</Button>
          <Button size="sm" variant="outline" onClick={()=>mutation.mutate({id:b.id,name:b.name,active:!b.active})}>{b.active?"Ocultar":"Exibir"}</Button>
          <Button size="icon" variant="ghost" className="text-red-600" onClick={()=>{if(confirm(`Remover a marca ${b.name}?`))mutation.mutate({id:b.id,name:b.name,remove:true});}} aria-label={`Remover ${b.name}`}><Trash2/></Button>
        </li>)}</ul>}
    </Panel>
  </>;
}
