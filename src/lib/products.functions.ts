import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";
import { mapProductRow } from "./product-mapper";

const SIGNED_URL_TTL_SECONDS = 60 * 60;
const SIGNED_URL_REUSE_MS = 50 * 60 * 1000;

// Product photos are public storefront content, but the Storage bucket stays private.
// Reuse the same short-lived signed URL in warm server instances instead of minting
// a new token on every SSR request. Nothing is persisted in the database.
const signedProductImageCache = new Map<string, { url: string; expiresAt: number }>();

function createStoreProductsClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) {
    throw new Error("Store products: missing Supabase backend environment variables");
  }

  return createClient<Database>(url, key, {
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
}

async function resolveProductImageUrls(
  client: ReturnType<typeof createStoreProductsClient>,
  references: string[],
): Promise<Map<string, string>> {
  const resolved = new Map<string, string>();
  const missing: string[] = [];
  const now = Date.now();

  for (const reference of [...new Set(references.filter(Boolean))]) {
    if (/^https?:\/\//i.test(reference)) {
      resolved.set(reference, reference);
      continue;
    }

    const cached = signedProductImageCache.get(reference);
    if (cached && cached.expiresAt > now + 60_000) {
      resolved.set(reference, cached.url);
    } else {
      missing.push(reference);
    }
  }

  if (missing.length > 0) {
    const { data, error } = await client.storage
      .from("product-images")
      .createSignedUrls(missing, SIGNED_URL_TTL_SECONDS);

    if (error) {
      console.error("product image signing failed:", error.message);
    } else {
      for (const item of data ?? []) {
        if (!item.signedUrl) {
          console.error("product image signing failed:", item.path, item.error?.message);
          continue;
        }
        resolved.set(item.path, item.signedUrl);
        signedProductImageCache.set(item.path, {
          url: item.signedUrl,
          expiresAt: now + SIGNED_URL_REUSE_MS,
        });
      }
    }
  }

  // Keep the process-local cache bounded in long-lived runtimes.
  if (signedProductImageCache.size > 1_000) {
    for (const [path, entry] of signedProductImageCache) {
      if (entry.expiresAt <= now) signedProductImageCache.delete(path);
    }
  }

  return resolved;
}

/** Public storefront list: only sign cover images; gallery files are signed on product detail pages. */
export const listStoreProducts = createServerFn({ method: "GET" }).handler(async () => {
  const client = createStoreProductsClient();
  const { data, error } = await client
    .from("products")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = data ?? [];
  const coverReferences = rows
    .map((row) => row.image_url)
    .filter((reference): reference is string => typeof reference === "string" && reference.length > 0);
  const urls = await resolveProductImageUrls(client, coverReferences);

  return rows.map((row) => ({
    ...row,
    image_url: urls.get(row.image_url) ?? row.image_url,
    // Do not sign/download every gallery image for every product in the homepage listing.
    gallery_urls: [],
  })).map(mapProductRow);
});

/** Sign only the selected product gallery when a customer opens its detail page. */
export const getStoreProductGallery = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().trim().min(1).max(160) }))
  .handler(async ({ data }) => {
    const client = createStoreProductsClient();
    const { data: row, error } = await client
      .from("products")
      .select("image_url,gallery_urls")
      .eq("slug", data.slug)
      .eq("active", true)
      .maybeSingle();

    if (error) throw error;
    if (!row) return [];

    const gallery = Array.isArray(row.gallery_urls)
      ? row.gallery_urls.filter((value): value is string => typeof value === "string" && value.length > 0)
      : [];
    const references = [...new Set([row.image_url, ...gallery].filter((value): value is string => typeof value === "string" && value.length > 0))];
    const urls = await resolveProductImageUrls(client, references);

    return references.map((reference) => urls.get(reference) ?? "").filter(Boolean);
  });
