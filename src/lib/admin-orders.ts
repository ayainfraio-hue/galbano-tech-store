import { supabase } from "@/integrations/supabase/client";
import type { DateRange } from "@/lib/date-range";

const PAGE = 1000;

/** Busca todos os pedidos criados dentro do período (paginando de 1000 em 1000). */
export async function fetchOrdersInRange<T>(columns: string, range: DateRange): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("orders")
      .select(columns)
      .gte("created_at", range.start.toISOString())
      .lt("created_at", range.end.toISOString())
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data as unknown as T[]));
    if (!data || data.length < PAGE) return rows;
  }
}
