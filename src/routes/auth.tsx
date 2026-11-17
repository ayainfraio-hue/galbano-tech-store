import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Logo } from "@/components/store/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type Mode = "login" | "signup" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Entrar no painel — Gálbano Tech" },
      { name: "description", content: "Acesso ao painel administrativo da Gálbano Tech." },
      { property: "og:title", content: "Entrar no painel — Gálbano Tech" },
      { property: "og:description", content: "Acesso ao painel administrativo da Gálbano Tech." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email("Informe um e-mail válido").max(255),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres").max(72),
});

function safeRedirect(value?: string) {
  return value && value.startsWith("/admin") ? value : "/admin";
}

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: safeRedirect(redirect), replace: true });
    });
  }, [navigate, redirect]);

  async function submit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setNotice(null);
    if (mode === "forgot") {
      const parsed = credentials.shape.email.safeParse(email);
      if (!parsed.success) return void toast.error(parsed.error.issues[0]?.message);
      setBusy(true);
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setBusy(false);
      if (error) return void toast.error("Não foi possível enviar o e-mail", { description: error.message });
      setNotice("Se o e-mail estiver cadastrado, você receberá um link para criar uma nova senha.");
      return;
    }

    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) return void toast.error(parsed.error.issues[0]?.message);
    setBusy(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      setBusy(false);
      if (error) {
        return void toast.error("Não foi possível entrar", {
          description: /confirm/i.test(error.message) ? "Confirme seu e-mail pelo link enviado antes de entrar." : "E-mail ou senha incorretos.",
        });
      }
      navigate({ to: safeRedirect(redirect), replace: true });
    } else {
      const { data, error } = await supabase.auth.signUp({
        ...parsed.data,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      setBusy(false);
      if (error) return void toast.error("Não foi possível criar a conta", { description: error.message });
      if (data.session) {
        navigate({ to: "/admin", replace: true });
      } else {
        setNotice("Conta criada! Enviamos um link de confirmação para o seu e-mail. Confirme e depois entre aqui.");
        setMode("login");
      }
    }
  }

  const titles: Record<Mode, string> = {
    login: "Entrar no painel",
    signup: "Primeiro acesso",
    forgot: "Recuperar senha",
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <Logo />
      <div className="mt-8 w-full max-w-sm rounded-3xl border border-gold/30 bg-panel p-6 sm:p-8">
        <h1 className="text-2xl font-bold">{titles[mode]}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signup"
            ? "Crie a senha do e-mail de administrador cadastrado."
            : mode === "forgot"
              ? "Enviaremos um link para criar uma nova senha."
              : "Área restrita à equipe da Gálbano Tech."}
        </p>

        {notice && <p className="mt-4 rounded-xl border border-gold/40 bg-gold/10 p-3 text-sm text-foreground">{notice}</p>}

        <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}
          <Button type="submit" variant="gold" size="lg" className="w-full rounded-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {mode === "login" ? "Entrar" : mode === "signup" ? "Criar acesso" : "Enviar link"}
          </Button>
        </form>

        <div className="mt-5 flex flex-col items-center gap-2 text-sm">
          {mode === "login" ? (
            <>
              <button type="button" className="text-muted-foreground hover:text-gold" onClick={() => setMode("forgot")}>
                Esqueci minha senha
              </button>
              <button type="button" className="text-muted-foreground hover:text-gold" onClick={() => setMode("signup")}>
                Primeiro acesso? Criar senha
              </button>
            </>
          ) : (
            <button type="button" className="text-muted-foreground hover:text-gold" onClick={() => setMode("login")}>
              Já tenho senha — entrar
            </button>
          )}
        </div>
      </div>
      <Link to="/" className="mt-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold">
        <ArrowLeft className="h-4 w-4" /> Voltar para a loja
      </Link>
    </div>
  );
}
