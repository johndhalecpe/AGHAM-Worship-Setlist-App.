import { supabase } from "@/lib/supabase";
import { todayLocalISO } from "@/lib/dates";
import { Setlist, SetlistWithSections } from "@/lib/type";

export async function getAllSetlists(): Promise<Setlist[]> {
  const { data, error } = await supabase
    .from("setlists")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getSetlistsWithSections(): Promise<SetlistWithSections[]> {
  const { data, error } = await supabase
    .from("setlists")
    .select(
      `
      *,
      sections:setlist_sections(
        *,
        songs(id, title, author, category, language)
      )
    `
    )
    .order("date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((setlist: Record<string, unknown>) => {
    const sections = (setlist.sections as Record<string, unknown>[] ?? []).map(
      (s: Record<string, unknown>) => ({
        ...s,
        songs: s.songs as SetlistWithSections["sections"][number]["songs"],
      })
    ) as SetlistWithSections["sections"];

    sections.sort((a, b) => a.sort_order - b.sort_order);

    return {
      ...setlist,
      sections,
    } as SetlistWithSections;
  });
}

export async function getSetlistById(id: string): Promise<Setlist | null> {
  const { data, error } = await supabase
    .from("setlists")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Setlist;
}

export async function createSetlist(data: {
  date: string;
  title?: string;
  description?: string;
  song_leader?: string;
  branch?: string;
}): Promise<Setlist> {
  const todayISOString = todayLocalISO();
  if (data.date < todayISOString) {
    throw new Error("Cannot create a setlist with a past date");
  }

  const { data: setlist, error } = await supabase
    .from("setlists")
    .insert({
      date: data.date,
      title: data.title ?? null,
      description: data.description ?? null,
      song_leader: data.song_leader ?? null,
      branch: data.branch ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return setlist;
}

export async function updateSetlist(
  id: string,
  data: {
    date?: string;
    title?: string;
    description?: string;
    song_leader?: string;
    branch?: string;
  },
): Promise<Setlist> {
  const { data: setlist, error } = await supabase
    .from("setlists")
    .update({
      date: data.date,
      title: data.title,
      description: data.description,
      song_leader: data.song_leader,
      branch: data.branch,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return setlist;
}

export async function deleteSetlist(id: string): Promise<void> {
  const { error } = await supabase
    .from("setlists")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function isSetlistDateInPast(id: string): Promise<boolean> {
  const { data } = await supabase
    .from("setlists")
    .select("date")
    .eq("id", id)
    .single();

  if (!data) return false;
  const today = todayLocalISO();
  return data.date < today;
}
