import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

export function useStoreBrands() {
  return useQuery({
    queryKey: ["store-brands"],
    queryFn: async () => {
      const { data, error } = await supabase.from("store_brands").select("id,name,sort_order,active").eq("active", true).order("sort_order");
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}

export function useCustomerGallery() {
  return useQuery({
    queryKey: ["customer-gallery"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customer_gallery").select("id,customer_name,message,image_url,sort_order").eq("active", true).order("sort_order").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}
