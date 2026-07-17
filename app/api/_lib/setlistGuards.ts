import { supabase } from "@/lib/supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import { todayLocalISO } from "@/lib/dates";

export async function isSetlistDateInPast(id: string, client?: SupabaseClient): Promise<boolean> {
  try {
    const db = client ?? supabase;
    const { data } = await db
      .from("setlists")
      .select("date")
      .eq("id", id)
      .single();
    if (!data) return false;
    const today = todayLocalISO();
    return data.date < today;
  } catch {
    return false;
  }
}
