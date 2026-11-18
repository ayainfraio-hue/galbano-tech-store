import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, Instagram, Mail, MapPin, MessageCircle, Package, Save, Store } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { PageHeader, Panel } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      const phone = form.whatsapp_number.replace(/\\D/g, "");
      if (phone.length < 10 || phone.length > 15) throw new Error("Informe o WhatsApp com DDI e DDD, somente números.");
      const { error } = await supabase.from("store_settings").update({ ...form, whatsapp_number: phone }).eq("id", "default");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configurações salvas");
      qc.invalidateQueries({ queryKey: ["store-settings"] });
      qc.invalidateQueries({ queryKey: ["admin", "store-settings"] });
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível salvar"),
  });

  function submitSettings(e: FormEvent) { e.preventDefault(); saveSettings.mutate(); }

  if (settings.isLoading) return <><PageHeader title="Configurações" description="Gerencie as informações e preferências da sua loja." /><Panel className="p-10 text-center text-sm text-slate-500">Carregando configurações…</Panel></>;
  if (settings.isError) return <><PageHeader title="Configurações" description="Gerencie as informações e preferências da sua loja." /><Panel className="p-10 text-center text-sm text-red-600">Não foi possível carregar as configurações. Atualize a página e tente novamente.</Panel></>;

  return <>
    <PageHeader title="Configurações" description="Tudo o que mantém as informações da sua loja atualizadas." />
    <form onSubmit={submitSettings} className="space-y-5">
      <SettingsSection icon={<Store className="h-5 w-5" />} title="Identidade da loja" description="Informações que identificam sua empresa para os clientes.">
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <Field label="Nome da loja"><Input value={form.store_name} onChange={e => setForm({ ...form, store_name: e.target.value })} placeholder="Galbano Tech" /></Field>
          <Field label="E-mail de contato" icon={<Mail className="h-3.5 w-3.5" />}><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="contato@sualoja.com" /></Field>
          <Field label="Instagram" icon={<Instagram className="h-3.5 w-3.5" />}><Input value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} placeholder="@sualoja ou URL" /></Field>
          <Field label="Endereço / cidade" icon={<MapPin className="h-3.5 w-3.5" />}><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Cidade - UF ou endereço completo" /></Field>
        </div>
      </SettingsSection>

      <SettingsSection icon={<MessageCircle className="h-5 w-5" />} title="Atendimento e comunicação" description="Defina como os clientes falam com você e veem os avisos da loja.">
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <Field label="WhatsApp comercial" hint="Inclua DDI + DDD. Ex.: 5511999999999"><Input value={form.whatsapp_number} onChange={e => setForm({ ...form, whatsapp_number: e.target.value.replace(/\\D/g, "") })} placeholder="5511999999999" inputMode="numeric" /></Field>
          <Field label="Horário de atendimento" icon={<Clock3 className="h-3.5 w-3.5" />}><Input value={form.business_hours} onChange={e => setForm({ ...form, business_hours: e.target.value })} placeholder="Seg a sex, das 9h às 18h" /></Field>
          <Field label="Aviso no topo da loja · 1"><Input value={form.top_notice_1} onChange={e => setForm({ ...form, top_notice_1: e.target.value })} maxLength={120} placeholder="Ex.: Entrega para todo o Brasil" /></Field>
          <Field label="Aviso no topo da loja · 2"><Input value={form.top_notice_2} onChange={e => setForm({ ...form, top_notice_2: e.target.value })} maxLength={120} placeholder="Ex.: Atendimento rápido pelo WhatsApp" /></Field>
        </div>
      </SettingsSection>

      <SettingsSection icon={<Package className="h-5 w-5" />} title="Estoque" description="Ajuste quando o painel deve sinalizar produtos com poucas unidades.">
        <div className="max-w-sm">
          <Field label="Alerta de estoque baixo" hint="O painel avisará quando a quantidade de um produto chegar a este número."><Input type="number" min="0" value={form.low_stock_threshold} onChange={e => setForm({ ...form, low_stock_threshold: Number(e.target.value) })} /></Field>
        </div>
      </SettingsSection>

      <div className="sticky bottom-3 z-10 flex justify-end">
        <div className="rounded-xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur">
          <Button variant="gold" type="submit" disabled={saveSettings.isPending}><Save className="h-4 w-4" />{saveSettings.isPending ? "Salvando…" : "Salvar alterações"}</Button>
        </div>
      </div>
    </form>
  </>;
}

function SettingsSection({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return <Panel className="overflow-hidden">
    <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">{icon}</div>
      <div className="min-w-0"><h2 className="font-semibold text-slate-900">{title}</h2><p className="mt-0.5 text-sm text-slate-500">{description}</p></div>
    </div>
    <div className="p-5 sm:p-6">{children}</div>
  </Panel>;
}

function Field({ label, hint, icon, children }: { label: string; hint?: string; icon?: ReactNode; children: ReactNode }) {
  return <div className="min-w-0 space-y-1.5">
    <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">{label}{icon && <span className="text-slate-400">{icon}</span>}</Label>
    {children}
    {hint && <p className="text-xs leading-relaxed text-slate-500">{hint}</p>}
  </div>;
}
