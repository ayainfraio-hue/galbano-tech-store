import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { appendSheetRows, ensureSheetTab, readSheetRows, type SheetRow } from "@/lib/google-sheets.server";

const TABLES = [
  { name: "products", key: "id", headers: ["id","name","slug","brand","sku","category","image_url","price","old_price","rating","reviews","badge","tags","short_description","description","specs","stock","min_stock","active","sort_order","created_at","updated_at","gallery_urls","variants","rating_count"] },
  { name: "orders", key: "id", headers: ["id","order_number","customer_name","customer_phone","status","items_count","total","stock_deducted","created_at","updated_at"] },
  { name: "order_items", key: "id", headers: ["id","order_id","product_id","product_name","sku","quantity","unit_price","subtotal","created_at","selected_options"] },
  { name: "stock_movements", key: "id", headers: ["id","product_id","order_id","type","quantity","reason","created_by","created_at"] },
  { name: "store_settings", key: "id", headers: ["id","whatsapp_number","low_stock_threshold","top_notice_1","top_notice_2","store_name","email","instagram","business_hours","address","updated_at"] },
  { name: "store_brands", key: "id", headers: ["id","name","sort_order","active","created_at"] },
  { name: "store_categories", key: "id", headers: ["id","name","slug","image_url","active","sort_order","created_at","updated_at"] },
  { name: "customer_gallery", key: "id", headers: ["id","customer_name","message","image_url","sort_order","active","created_at"] },
  { name: "admin_emails", key: "email", headers: ["email"] },
  { name: "user_roles", key: "id", headers: ["id","user_id","role"] },
] as const;

function cell(value: unknown): string | number | boolean {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  return JSON.stringify(value);
}

function sameValue(left: unknown, right: unknown): boolean {
  return String(cell(left)) === String(cell(right));
}

/** Additive and repeatable export. Existing rows are never deleted or overwritten. */
export const migrateSupabaseDataToSheets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = String(context.claims.email ?? "").trim().toLowerCase();
    if (!email) throw new Error("Não foi possível validar o e-mail da sessão.");

    const { data: allowed, error: allowError } = await (supabaseAdmin.from as any)("admin_emails")
      .select("email")
      .eq("email", email)
      .maybeSingle();
    if (allowError) throw allowError;
    if (!allowed) throw new Error("Apenas administradores autorizados podem iniciar a migração.");

    const report: { table: string; source: number; inserted: number; alreadyPresent: number; conflicts: number }[] = [];
    for (const table of TABLES) {
      const { data, error } = await (supabaseAdmin.from as any)(table.name).select("*");
      if (error) throw new Error(`Falha ao ler ${table.name}: ${error.message}`);

      const sourceRows = (data ?? []) as Record<string, unknown>[];
      await ensureSheetTab(table.name, [...table.headers]);
      const existingRows = await readSheetRows(table.name);
      const existingByKey = new Map(existingRows.map((row) => [String(row[table.key] ?? ""), row]));
      const missing: SheetRow[] = [];
      let alreadyPresent = 0;
      let conflicts = 0;

      for (const source of sourceRows) {
        const key = String(source[table.key] ?? "");
        if (!key) throw new Error(`Registro sem chave em ${table.name}; migração interrompida.`);
        const existing = existingByKey.get(key);
        if (!existing) {
          missing.push(source as SheetRow);
        } else if (table.headers.every((header) => sameValue(source[header], existing[header]))) {
          alreadyPresent += 1;
        } else {
          conflicts += 1;
        }
      }

      await appendSheetRows(table.name, missing);
      report.push({ table: table.name, source: sourceRows.length, inserted: missing.length, alreadyPresent, conflicts });
    }

    const conflicts = report.reduce((sum, item) => sum + item.conflicts, 0);
    return {
      success: conflicts === 0,
      message: conflicts
        ? "Cópia parcial: existem chaves repetidas com conteúdo diferente. Os registros existentes foram preservados sem sobrescrita."
        : "Cópia dos dados concluída. O banco original permanece intacto.",
      report,
    };
  });
