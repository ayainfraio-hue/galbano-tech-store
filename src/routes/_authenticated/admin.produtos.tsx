import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { EmptyState, PageHeader, Panel } from "@/components/admin/AdminUi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { categories, getCategory, productTags, slugify, type ProductTag } from "@/data/catalog";
import { supabase } from "@/integrations/supabase/client";
import type { ProductRow } from "@/lib/products";
import { formatBRL } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/produtos")({
  component: ProductsPage,
});

function ProductsPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<ProductRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<ProductRow | null>(null);

  const products = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("sort_order").order("created_at", { ascending: false });
      if (error) throw error;
      return Promise.all((data ?? []).map(async (product) => {
        if (/^https?:\/\//i.test(product.image_url)) return { ...product, displayImage: product.image_url };
        const { data: signed } = await supabase.storage.from("product-images").createSignedUrl(product.image_url, 60 * 60);
        return { ...product, displayImage: signed?.signedUrl ?? "" };
      }));
    },
  });

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (products.data ?? []).filter(
      (p) => !term || `${p.name} ${p.sku} ${p.brand}`.toLowerCase().includes(term),
    );
  }, [products.data, q]);

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto excluído");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["store-products"] });
      setDeleting(null);
    },
    onError: () => toast.error("Não foi possível excluir. Você pode ocultar o produto da loja."),
  });

  const toggleActive = useMutation({
    mutationFn: async (p: ProductRow) => {
      const { error } = await supabase.from("products").update({ active: !p.active }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["store-products"] });
    },
    onError: () => toast.error("Não foi possível alterar a visibilidade"),
  });

  return (
    <>
      <PageHeader
        title="Produtos"
        description="Cadastre, edite e escolha quais produtos aparecem na loja."
        actions={
          <Button variant="gold" className="rounded-full" onClick={() => setEditing("new")}>
            <Plus /> Novo produto
          </Button>
        }
      />
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, marca ou código" className="pl-9" />
      </div>

      <Panel>
        {list.length === 0 ? (
          <EmptyState>{products.isLoading ? "Carregando…" : "Nenhum produto encontrado."}</EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((p) => (
              <li key={p.id} className={cn("flex flex-wrap items-center gap-3 px-4 py-3 text-sm", !p.active && "opacity-60")}>
                <img src={p.displayImage} alt="" className="h-12 w-12 shrink-0 rounded-lg bg-surface object-contain p-1" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {getCategory(p.category as never)?.name ?? p.category} · Cód. {p.sku} · {p.stock} em estoque
                  </p>
                </div>
                <span className="w-28 text-right font-display font-bold">{formatBRL(Number(p.price))}</span>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch checked={p.active} onCheckedChange={() => toggleActive.mutate(p)} aria-label={`Mostrar ${p.name} na loja`} />
                  {p.active ? "Na loja" : "Oculto"}
                </label>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(p)} aria-label={`Editar ${p.name}`}>
                    <Pencil />
                  </Button>
                  <Button size="icon" variant="ghost" className="hover:text-destructive" onClick={() => setDeleting(p)} aria-label={`Excluir ${p.name}`}>
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <ProductForm product={editing} onClose={() => setEditing(null)} />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent className="border-gold/30 bg-panel">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.name}” sai da loja e do cadastro. Pedidos antigos continuam com o nome e o preço registrados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleting && remove.mutate(deleting.id)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const money = z.coerce.number().min(0, "Valor inválido").max(1_000_000, "Valor muito alto");

const formSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(160),
  slug: z.string().trim().min(2, "Informe o endereço").max(80).regex(/^[a-z0-9-]+$/, "Use só letras minúsculas, números e hífen"),
  brand: z.string().trim().min(1, "Informe a marca").max(60),
  sku: z.string().trim().max(40).optional(),
  category: z.string().min(1),
  price: money.refine((v) => v > 0, "Informe o preço"),
  old_price: z.union([z.literal(""), money]).optional(),
  stock: z.coerce.number().int().min(0).max(100000),
  min_stock: z.coerce.number().int().min(0).max(100000),
  badge: z.string().trim().max(30),
  short_description: z.string().trim().max(200),
  description: z.string().trim(),
  image_url: z.string().trim().min(1, "Envie uma foto do produto"),
  gallery_urls: z.array(z.string()).min(1).max(12),
  sort_order: z.coerce.number().int().min(0).max(10000).optional(),
});

type FormState = {
  name: string; slug: string; brand: string; sku: string; category: string; price: string; old_price: string;
  stock: string; min_stock: string; badge: string; short_description: string; description: string; image_url: string; gallery_urls: string[];
  sort_order: string; specs: string; tags: ProductTag[]; active: boolean;
};

function normalizeImageReference(value: string): string {
  const marker = "/storage/v1/object/sign/product-images/";
  const publicMarker = "/storage/v1/object/public/product-images/";
  try {
    const url = new URL(value);
    const path = url.pathname.includes(marker) ? url.pathname.split(marker)[1] : url.pathname.includes(publicMarker) ? url.pathname.split(publicMarker)[1] : null;
    return path ? decodeURIComponent(path) : value;
  } catch { return value; }
}

function toForm(p: ProductRow | null): FormState {
  const specs = Array.isArray(p?.specs) ? (p!.specs as [string, string][]).map(([k, v]) => `${k}: ${v}`).join("\n") : "";
  const galleryUrls = Array.isArray(p?.gallery_urls) ? p.gallery_urls.filter((value): value is string => typeof value === "string") : [];
  const images = [...new Set([p?.image_url ?? "", ...galleryUrls].filter(Boolean).map(normalizeImageReference))];
  return {
    name: p?.name ?? "", slug: p?.slug ?? "", brand: p?.brand ?? "", sku: p?.sku ?? "",
    category: p?.category ?? categories[0]?.slug ?? "smartphones", price: p ? String(p.price) : "", old_price: p?.old_price != null ? String(p.old_price) : "",
    stock: p ? String(p.stock) : "0", min_stock: p ? String(p.min_stock) : "3", badge: p?.badge ?? "",
    short_description: p?.short_description ?? "", description: p?.description ?? "", image_url: images[0] ?? "", gallery_urls: images,
    sort_order: p ? String(p.sort_order) : "100", specs, tags: (p?.tags ?? []) as ProductTag[], active: p?.active ?? true,
  };
}

function parseSpecs(text: string): [string, string][] {
  return text
    .split("\n")
    .map((line) => {
      const idx = line.indexOf(":");
      return idx > 0 ? [line.slice(0, idx).trim(), line.slice(idx + 1).trim()] : ["", ""];
    })
    .filter(([k, v]) => k && v)
    .slice(0, 30)
    .map(([k = "", v = ""]) => [k.slice(0, 60), v.slice(0, 200)] as [string, string]);
}

function ProductForm({ product, onClose }: { product: ProductRow | "new" | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const isNew = product === "new";
  const row = product && product !== "new" ? product : null;
  const [form, setForm] = useState<FormState>(toForm(null));
  const [slugTouched, setSlugTouched] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  const categoryOptions = useQuery({
    queryKey: ["store-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("store_categories").select("name,slug").eq("active", true).order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (product) {
      setForm(toForm(row));
      setSlugTouched(!isNew);
    }
  }, [product]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    let cancelled = false;
    async function loadPreviews() {
      const entries = await Promise.all(form.gallery_urls.map(async (path) => {
        if (/^https?:\/\//i.test(path)) return [path, path] as const;
        const { data } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60);
        return [path, data?.signedUrl ?? ""] as const;
      }));
      if (!cancelled) setImagePreviews(Object.fromEntries(entries));
    }
    void loadPreviews();
    return () => { cancelled = true; };
  }, [form.gallery_urls]);

  async function uploadFiles(files: FileList | null): Promise<void> {
    const selected = Array.from(files ?? []);
    if (!selected.length) return;
    if (selected.some((file) => !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)) return void toast.error("Escolha imagens de até 5 MB cada");
    if (form.gallery_urls.length + selected.length > 12) return void toast.error("Cada produto pode ter até 12 fotos");
    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of selected) {
        const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const path = `products/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type });
        if (error) throw error;
        uploaded.push(path);
      }
      setForm((current) => ({ ...current, gallery_urls: [...current.gallery_urls, ...uploaded], image_url: current.image_url || uploaded[0] || "" }));
      toast.success(`${uploaded.length} foto(s) enviada(s)`);
    } catch {
      toast.error("Falha ao enviar uma ou mais imagens");
    } finally { setUploading(false); }
  }

  function removeImage(path: string) {
    setForm((current) => {
      const gallery_urls = current.gallery_urls.filter((image) => image !== path);
      return { ...current, gallery_urls, image_url: current.image_url === path ? gallery_urls[0] ?? "" : current.image_url };
    });
  }

  const save = useMutation({
    mutationFn: async () => {
      const parsed = formSchema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);
      const v = parsed.data;
      const oldPrice = v.old_price === "" || v.old_price == null ? null : Number(v.old_price);
      const payload = {
        name: v.name, slug: v.slug, brand: v.brand, sku: v.sku || `GT-${v.slug.toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`, category: v.category,
        price: v.price, old_price: oldPrice && oldPrice > v.price ? oldPrice : null,
        min_stock: v.min_stock, badge: v.badge || null, short_description: v.short_description,
        description: v.description, image_url: v.image_url, gallery_urls: [v.image_url, ...form.gallery_urls.filter((image) => image !== v.image_url)], sort_order: v.sort_order ?? 100,
        specs: parseSpecs(form.specs), tags: form.tags, active: form.active,
      };
      if (isNew) {
        const { data, error } = await supabase.from("products").insert({ ...payload, stock: 0 }).select("id").single();
        if (error) throw error;
        if (v.stock > 0) {
          const { error: movError } = await supabase
            .from("stock_movements")
            .insert({ product_id: data.id, type: "entrada", quantity: v.stock, reason: "Estoque inicial" });
          if (movError) throw movError;
        }
      } else {
        const { error } = await supabase.from("products").update(payload).eq("id", row!.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isNew ? "Produto cadastrado" : "Produto atualizado");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["store-products"] });
      onClose();
    },
    onError: (err: { message?: string; code?: string }) => {
      const msg = err.code === "23505" ? "Já existe um produto com esse endereço ou código." : err.message;
      toast.error("Não foi possível salvar", { description: msg });
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto border-gold/30 bg-panel">
        <DialogHeader>
          <DialogTitle>{isNew ? "Novo produto" : "Editar produto"}</DialogTitle>
          <DialogDescription>Os dados aparecem na loja assim que você salvar.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="mt-2 grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="Nome" className="sm:col-span-2">
            <Input
              value={form.name}
              maxLength={160}
              onChange={(e) => {
                set("name", e.target.value);
                if (!slugTouched) set("slug", slugify(e.target.value));
              }}
            />
          </Field>
          <Field label="Endereço na loja (/produto/…)">
            <Input value={form.slug} maxLength={80} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} />
          </Field>
          <Field label="Marca">
            <Input value={form.brand} maxLength={60} onChange={(e) => set("brand", e.target.value)} />
          </Field>
          <Field label="Categoria">
            <Select value={form.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(categoryOptions.data?.length ? categoryOptions.data : categories).map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Preço (R$)">
            <Input type="number" min={0} step="0.01" inputMode="decimal" value={form.price} onChange={(e) => set("price", e.target.value)} />
          </Field>
          <Field label="Preço antigo (opcional, mostra desconto)">
            <Input type="number" min={0} step="0.01" inputMode="decimal" value={form.old_price} onChange={(e) => set("old_price", e.target.value)} />
          </Field>
          {isNew ? (
            <Field label="Estoque inicial">
              <Input type="number" min={0} inputMode="numeric" value={form.stock} onChange={(e) => set("stock", e.target.value)} />
            </Field>
          ) : (
            <Field label="Estoque atual">
              <p className="flex h-9 items-center text-sm text-muted-foreground">{row?.stock} un. — ajuste na tela Estoque</p>
            </Field>
          )}
          <Field label="Avisar estoque baixo a partir de">
            <Input type="number" min={0} inputMode="numeric" value={form.min_stock} onChange={(e) => set("min_stock", e.target.value)} />
          </Field>
          <Field label="Selo (opcional)">
            <Input value={form.badge} maxLength={30} placeholder="Ex.: Novo, Exclusivo" onChange={(e) => set("badge", e.target.value)} />
          </Field>

          <Field label="Fotos do produto (até 12)" className="sm:col-span-2">
            <div className="space-y-3">
              <label className={cn("inline-flex cursor-pointer items-center gap-2 rounded-full border border-gold/60 px-4 py-2 text-sm text-gold hover:bg-gold hover:text-primary-foreground", uploading && "pointer-events-none opacity-60")}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                {uploading ? "Enviando fotos…" : "Adicionar fotos"}
                <input type="file" accept="image/*" multiple className="sr-only" disabled={uploading} onChange={(e) => { void uploadFiles(e.target.files); e.target.value = ""; }} />
              </label>
              {form.gallery_urls.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {form.gallery_urls.map((path) => (
                    <div key={path} className={cn("relative overflow-hidden rounded-xl border bg-surface p-2", form.image_url === path ? "border-gold ring-2 ring-gold/30" : "border-border")}>
                      <img src={imagePreviews[path] || ""} alt="Foto do produto" className="aspect-square w-full object-contain" />
                      <Button type="button" size="sm" variant={form.image_url === path ? "gold" : "outline"} className="mt-2 w-full text-xs" onClick={() => set("image_url", path)}>
                        {form.image_url === path ? "Capa selecionada" : "Definir como capa"}
                      </Button>
                      <button type="button" onClick={() => removeImage(path)} aria-label="Remover foto" className="absolute right-2 top-2 rounded-full bg-background/90 p-1 text-destructive shadow"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">Nenhuma foto adicionada.</p>}
            </div>
          </Field>

          <Field label="Vitrines" className="sm:col-span-2">
            <div className="flex flex-wrap gap-4">
              {productTags.map((t) => (
                <label key={t.value} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.tags.includes(t.value)}
                    onCheckedChange={(c) => set("tags", c ? [...form.tags, t.value] : form.tags.filter((x) => x !== t.value))}
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Resumo" className="sm:col-span-2">
            <Input value={form.short_description} maxLength={200} onChange={(e) => set("short_description", e.target.value)} />
          </Field>
          <Field label="Descrição" className="sm:col-span-2">
            <Textarea rows={8} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <Field label="Especificações (uma por linha, “Nome: valor”)" className="sm:col-span-2">
            <Textarea rows={4} value={form.specs} placeholder={"Tela: 6.7\" AMOLED\nMemória: 256 GB"} onChange={(e) => set("specs", e.target.value)} />
          </Field>
          <label className="flex items-center gap-3 text-sm sm:col-span-2">
            <Switch checked={form.active} onCheckedChange={(c) => set("active", c)} /> Mostrar na loja
          </label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="gold" className="rounded-full" disabled={save.isPending || uploading}>
              {save.isPending && <Loader2 className="animate-spin" />} Salvar produto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
