import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import { mapProductRow } from "./product-mapper";

const BUCKET = "product-images";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

function extractStoragePath(value: string): string | null {
  if (!value.startsWith("http")) return value.startsWith("products/") ? value : null;
  try {
    const url = new URL(value);
    const marker = `/storage/v1/object/sign/${BUCKET}/`;
    const index = url.pathname.indexOf(marker);
    if (index < 0) return null;
    return decodeURIComponent(url.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

/** Lista produtos e assina temporariamente caminhos do bucket privado no servidor. */
export const listStoreProducts = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? process.env["SUPABASE_SECRET_KEY"];
  if (!url || !key) {
    console.error("listStoreProducts: missing backend env");
    return [];
  }

  const client = createClient<Database>(url, serviceKey || key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if ((key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) || serviceKey?.startsWith("sb_")) h.delete("Authorization");
        h.set("apikey", serviceKey || key);
        if (serviceKey && !serviceKey.startsWith("sb_")) h.set("Authorization", `Bearer ${serviceKey}`);
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

  const rows = data ?? [];
  const paths = [...new Set(rows.flatMap((row) => {
    const gallery = Array.isArray(row.gallery_urls) ? row.gallery_urls.filter((item): item is string => typeof item === "string") : [];
    return [...gallery, row.image_url].map(extractStoragePath).filter((path): path is string => Boolean(path));
  }))];

  const signed = new Map<string, string>();
  if (paths.length) {
    if (!serviceKey) {
      console.error("listStoreProducts: missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY for private product image signing");
    } else {
      const { data: signedData, error: signError } = await client.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
      if (signError) console.error("listStoreProducts: image signing failed", signError.message);
      for (const item of signedData ?? []) {
        if (item.path && item.signedUrl) signed.set(item.path, item.signedUrl);
      }
    }
  }

  return rows.map((row) => {
    const rawGallery = Array.isArray(row.gallery_urls) ? row.gallery_urls.filter((item): item is string => typeof item === "string") : [];
    const gallerySource = rawGallery.length ? rawGallery : [row.image_url];
    const gallery = gallerySource.map((item) => {
      const path = extractStoragePath(item);
      return (path && signed.get(path)) || item;
    });
    const imagePath = extractStoragePath(row.image_url);
    const image = (imagePath && signed.get(imagePath)) || row.image_url;
    return mapProductRow({ ...row, image_url: image, gallery_urls: gallery });
  });
});
