import { supabase } from "@/lib/supabase";
import { todayLocalISO } from "@/lib/dates";

export async function isSetlistDateInPast(id: string): Promise<boolean> {
  try {
    const { data } = await supabase
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
