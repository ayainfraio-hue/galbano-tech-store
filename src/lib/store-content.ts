import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { categories as fallbackCategories } from "@/data/catalog";

export type StoreSettings = {
  id: string;
  whatsapp_number: string;
  low_stock_threshold: number;
  top_notice_1: string;
  top_notice_2: string;
  store_name: string;
  email: string;
  instagram: string;
  business_hours: string;
  address: string;
};

export const defaultStoreSettings: StoreSettings = {
  id: "default",
  whatsapp_number: "556292643627",
  low_stock_threshold: 3,
  top_notice_1: "Tecnologia premium com atendimento personalizado",
  top_notice_2: "Peça pelo WhatsApp e receba atendimento exclusivo",
  store_name: "Gálbano Tech",
  email: "",
  instagram: "",
  business_hours: "",
  address: "",
};

export function useStoreSettings() {
  return useQuery({
    queryKey: ["store-settings"],
    queryFn: async () => {
      // This table is not yet present in the generated Supabase Database type.
      const { data, error } = await (supabase.from as any)("store_settings")
        .select("*")
        .eq("id", "default")
        .single();
      if (error) throw error;
      return data as StoreSettings;
    },
    staleTime: 60_000,
    placeholderData: defaultStoreSettings,
  });
}

export type StoreBrand = {
  id: string;
  name: string;
  sort_order: number;
  active: boolean;
};

export type CustomerGalleryItem = {
  id: string;
  customer_name: string;
  message: string;
  image_url: string;
  sort_order: number;
};

type ContentQueryResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

/**
 * These tables are provisioned in Supabase but are absent from the checked-in
 * generated Database type. Keep the any escape hatch local to each table
 * access, then narrow the returned rows before exposing them to UI components.
 */
export const storeBrandsQueryOptions = queryOptions({
  queryKey: ["store-brands"],
  queryFn: async (): Promise<StoreBrand[]> => {
    const result = await (supabase.from as any)("store_brands")
      .select("id,name,sort_order,active")
      .eq("active", true)
      .order("sort_order");
    const { data, error } = result as ContentQueryResult<StoreBrand>;
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 60_000,
});

export function useStoreBrands() {
  return useQuery(storeBrandsQueryOptions);
}

export const customerGalleryQueryOptions = queryOptions({
  queryKey: ["customer-gallery"],
  queryFn: async (): Promise<CustomerGalleryItem[]> => {
    const result = await (supabase.from as any)("customer_gallery")
      .select("id,customer_name,message,image_url,sort_order")
      .eq("active", true)
      .order("sort_order")
      .order("created_at", { ascending: false });
    const { data, error } = result as ContentQueryResult<CustomerGalleryItem>;
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 60_000,
});

export function useCustomerGallery() {
  return useQuery(customerGalleryQueryOptions);
}

export type StoreCategory = {
  id?: string;
  name: string;
  slug: string;
  image_url: string | null;
  active?: boolean;
  sort_order?: number;
};

export function useStoreCategories() {
  return useQuery({
    queryKey: ["store-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_categories")
        .select("id,name,slug,image_url,active,sort_order")
        .eq("active", true)
        .order("sort_order")
        .order("name");
      if (error) throw error;
      return data as StoreCategory[];
    },
    staleTime: 30_000,
    placeholderData: fallbackCategories.map((category, index) => ({
      id: undefined,
      name: category.name,
      slug: category.slug,
      image_url: category.image,
      active: true,
      sort_order: index + 1,
    })),
  });
}
