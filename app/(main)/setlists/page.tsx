import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase";
import { SetlistWithSections } from "@/lib/type";
import SetlistList from "./_components/SetlistList";

export const revalidate = 30;

const fetchAllSetlists = unstable_cache(
  async (): Promise<SetlistWithSections[]> => {
  const { data, error } = await supabase
    .from("setlists")
    .select(
      `
      id, date, title, description, song_leader, branch, spotify_playlist_id, spotify_playlist_url, created_at,
      sections:setlist_sections(
        id, setlist_id, section_type, sort_order, song_id, notes, song_key,
        songs(id, title, author, category, language, lyrics, chords, default_key, default_bpm, default_time_signature, status)
      )
    `
    )
    .order("date", { ascending: false })
    .limit(50);

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
},
  ["setlists-list"],
  { tags: ["setlists"], revalidate: 30 }
);

export default async function SetlistsPage() {
  const setlists = await fetchAllSetlists();

  return <SetlistList setlists={setlists} />;
}
