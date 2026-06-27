import { supabase } from "@/lib/supabase";

export async function isSetlistDateInPast(id: string): Promise<boolean> {
  const { data } = await supabase
    .from("setlists")
    .select("date")
    .eq("id", id)
    .single();
  if (!data) return false;
  const today = new Date().toISOString().split("T")[0];
  return data.date < today;
}
