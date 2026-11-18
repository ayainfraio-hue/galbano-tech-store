import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
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

  function submitSettings(e:FormEvent){e.preventDefault();saveSettings.mutate();}
  return <>
    <PageHeader title="Configurações" description="Informações comerciais e preferências gerais da loja." />
    <Panel className="p-5 sm:p-7">
      <form onSubmit={submitSettings} className="space-y-7">
        <section className="space-y-4">
          <div><h2 className="text-base font-semibold text-slate-900">Contato e pedidos</h2><p className="text-sm text-slate-500">Como os clientes entram em contato e recebem avisos.</p></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="WhatsApp comercial" hint="DDI + DDD + número. Ex.: 5511999999999"><Input value={form.whatsapp_number} onChange={e=>setForm({...form,whatsapp_number:e.target.value.replace(/\D/g,"")})} placeholder="5511999999999" inputMode="numeric" /></Field>
            <Field label="Alerta de estoque baixo"><Input type="number" min="0" value={form.low_stock_threshold} onChange={e=>setForm({...form,low_stock_threshold:Number(e.target.value)})}/></Field>
            <Field label="Aviso no topo da loja · 1"><Input value={form.top_notice_1} onChange={e=>setForm({...form,top_notice_1:e.target.value})} maxLength={120}/></Field>
            <Field label="Aviso no topo da loja · 2"><Input value={form.top_notice_2} onChange={e=>setForm({...form,top_notice_2:e.target.value})} maxLength={120}/></Field>
          </div>
        </section>
        <div className="border-t border-slate-100"/>
        <section className="space-y-4">
          <div><h2 className="text-base font-semibold text-slate-900">Dados da loja</h2><p className="text-sm text-slate-500">Informações exibidas nos canais de atendimento.</p></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Nome da loja"><Input value={form.store_name} onChange={e=>setForm({...form,store_name:e.target.value})}/></Field>
            <Field label="E-mail"><Input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></Field>
            <Field label="Instagram"><Input value={form.instagram} onChange={e=>setForm({...form,instagram:e.target.value})} placeholder="@sualoja ou URL"/></Field>
            <Field label="Horário de atendimento"><Input value={form.business_hours} onChange={e=>setForm({...form,business_hours:e.target.value})} placeholder="Seg a sex, das 9h às 18h"/></Field>
            <div className="sm:col-span-2"><Field label="Endereço / cidade"><Input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Cidade - UF ou endereço completo"/></Field></div>
          </div>
        </section>
        <div className="flex justify-end border-t border-slate-100 pt-5"><Button variant="gold" type="submit" disabled={saveSettings.isPending}><Save/> {saveSettings.isPending?"Salvando…":"Salvar alterações"}</Button></div>
      </form>
    </Panel>
  </>;
}

function Field({label,hint,children}:{label:string;hint?:string;children:ReactNode}){
  return <div className="space-y-1.5"><Label>{label}</Label>{children}{hint&&<p className="text-xs text-muted-foreground">{hint}</p>}</div>;
}
