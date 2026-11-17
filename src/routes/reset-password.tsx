import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/store/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — Gálbano Tech" },
      { name: "description", content: "Defina uma nova senha para o painel da Gálbano Tech." },
      { property: "og:title", content: "Nova senha — Gálbano Tech" },
      { property: "og:description", content: "Defina uma nova senha para o painel da Gálbano Tech." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (password.length < 8) return void toast.error("A senha precisa ter pelo menos 8 caracteres");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return void toast.error("Não foi possível salvar a senha", { description: "Abra novamente o link enviado por e-mail." });
    toast.success("Senha atualizada");
    navigate({ to: "/admin", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <Logo />
      <form onSubmit={submit} className="mt-8 w-full max-w-sm space-y-4 rounded-3xl border border-gold/30 bg-panel p-6 sm:p-8">
        <h1 className="text-2xl font-bold">Criar nova senha</h1>
        <div className="space-y-1.5">
          <Label htmlFor="new-password">Nova senha</Label>
          <Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" variant="gold" size="lg" className="w-full rounded-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />} Salvar senha
        </Button>
      </form>
    </div>
  );
}
