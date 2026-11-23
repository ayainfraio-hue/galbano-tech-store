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
      const { data, error } = await supabase.from("store_settings").select("*").eq("id", "default").single();
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

/**
 * These two content tables are provisioned in Supabase but are absent from the
 * checked-in generated Database type. Keep the escape hatch local to the query
 * boundary and expose strongly typed rows to the UI instead of leaking
 * PostgREST SelectQueryError into component props.
 */
const contentTableClient = supabase as unknown as {
  from: (table: "store_brands" | "customer_gallery") => {
    select: (columns: string) => {
      eq: (column: string, value: boolean) => {
        order: (column: string, options?: { ascending?: boolean }) => {
          order: (column: string, options?: { ascending?: boolean }) => Promise<{
            data: unknown;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
};

export const storeBrandsQueryOptions = queryOptions({
  queryKey: ["store-brands"],
  queryFn: async (): Promise<StoreBrand[]> => {
    const { data, error } = await contentTableClient
      .from("store_brands")
      .select("id,name,sort_order,active")
      .eq("active", true)
      .order("sort_order");
    if (error) throw error;
    return (data ?? []) as StoreBrand[];
  },
  staleTime: 60_000,
});

export function useStoreBrands() {
  return useQuery(storeBrandsQueryOptions);
}

export const customerGalleryQueryOptions = queryOptions({
  queryKey: ["customer-gallery"],
  queryFn: async (): Promise<CustomerGalleryItem[]> => {
    const { data, error } = await contentTableClient
      .from("customer_gallery")
      .select("id,customer_name,message,image_url,sort_order")
      .eq("active", true)
      .order("sort_order")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as CustomerGalleryItem[];
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
