import { supabase } from "@/integrations/supabase/client";

/**
 * Keep the logo in the existing public media bucket. Its current RLS policies
 * allow public reads and restrict writes to authenticated admins.
 */
export const BRAND_LOGO_BUCKET = "customer-gallery";
export const BRAND_LOGO_PATH = "brand-identity/galbano-logo";

export function getBrandLogoUrl() {
  return supabase.storage.from(BRAND_LOGO_BUCKET).getPublicUrl(BRAND_LOGO_PATH).data.publicUrl;
}

/** Replace the favicon only when the centrally stored logo is available. */
export function refreshBrandFavicon() {
  if (typeof document === "undefined") return;
  const url = `${getBrandLogoUrl()}?v=${Date.now()}`;
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
