import { supabase } from "@/integrations/supabase/client";

/**
 * Keep the logo in the existing public media bucket. Its current RLS policies
 * allow public reads and restrict writes to authenticated admins.
 */
export const BRAND_LOGO_BUCKET = "customer-gallery";
export const BRAND_LOGO_PATH = "brand-identity/galbano-logo";

let faviconVersion: number | null = null;

export function getBrandLogoUrl() {
  return supabase.storage.from(BRAND_LOGO_BUCKET).getPublicUrl(BRAND_LOGO_PATH).data.publicUrl;
}

/** Reuse the stable favicon URL; add a cache-buster only after an explicit logo update. */
export function refreshBrandFavicon(forceRefresh = false) {
  if (typeof document === "undefined") return;
  if (forceRefresh) faviconVersion = Date.now();

  const baseUrl = getBrandLogoUrl();
  const url = faviconVersion === null ? baseUrl : `${baseUrl}?v=${faviconVersion}`;
  const probe = new Image();
  probe.onload = () => {
    let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.removeAttribute("type");
    link.href = url;
  };
  probe.onerror = () => {};
  probe.src = url;
}
