import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import { mapProductRow } from "./product-mapper";

/** Leitura pública dos produtos ativos da loja (usada também na renderização no servidor). */
export const listStoreProducts = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) {
    console.error("listStoreProducts: missing backend env");
    return [];
  }
  const client = createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data, error } = await client
    .from("products")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) {
    console.error("listStoreProducts:", error.message);
    return [];
  }
  const resolved = await Promise.all((data ?? []).map(async (row) => {
    const references = [...new Set([row.image_url, ...(Array.isArray(row.gallery_urls) ? row.gallery_urls.filter((value): value is string => typeof value === "string") : [])])];
    const signed = await Promise.all(references.map(async (reference) => {
      if (/^https?:\/\//i.test(reference)) return [reference, reference] as const;
      const { data: signedData, error: signedError } = await client.storage.from("product-images").createSignedUrl(reference, 60 * 60);
      if (signedError || !signedData) {
        console.error("product image signing failed:", reference, signedError?.message);
        return [reference, ""] as const;
      }
      return [reference, signedData.signedUrl] as const;
    }));
    const urls = new Map(signed);
    return {
      ...row,
      image_url: urls.get(row.image_url) || row.image_url,
      gallery_urls: references.map((reference) => urls.get(reference) || reference).filter(Boolean),
    };
  }));
  return resolved.map(mapProductRow);
});
