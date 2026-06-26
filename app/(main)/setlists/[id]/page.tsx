import { supabase } from "@/lib/supabase";
import { Setlist, SetlistSectionWithSong } from "@/lib/type";
import SetlistContent from "@/components/setlists/SetlistContent";

async function getSetlist(id: string) {
  const { data, error } = await supabase
    .from("setlists")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Setlist;
}

async function getSections(id: string) {
  const { data, error } = await supabase
    .from("setlist_sections")
    .select(
      `
      *,
      songs (
        id,
        title,
        author,
        category
      )
    `
    )
    .eq("setlist_id", id)
    .order("sort_order", { ascending: true });

  if (error) return [];
  return data as unknown as SetlistSectionWithSong[];
}

export default async function SetlistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [setlist, sections] = await Promise.all([
    getSetlist(id),
    getSections(id),
  ]);

  if (!setlist) {
    return (
      <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
        Setlist not found.
      </p>
    );
  }

  const isPast = new Date(setlist.date) < new Date(new Date().toDateString());

  return (
    <SetlistContent
      initialSetlist={setlist}
      initialSections={sections}
      isPast={isPast}
    />
  );
}
