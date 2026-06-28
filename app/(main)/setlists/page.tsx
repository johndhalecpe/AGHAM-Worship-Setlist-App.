import { supabase } from "@/lib/supabase";
import { SetlistWithSections } from "@/lib/type";
import SetlistList from "./_components/SetlistList";

export const dynamic = "force-dynamic";

async function fetchAllSetlists(): Promise<SetlistWithSections[]> {
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

export default async function SetlistsPage() {
  const setlists = await fetchAllSetlists();

  return <SetlistList setlists={setlists} />;
}
