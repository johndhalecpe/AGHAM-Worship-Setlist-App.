import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase";
import { Setlist, SetlistSectionWithSong } from "@/lib/type";
import { getBranchLabel } from "@/lib/branches";
import SetlistDetail from "./SetlistDetail";

const getSetlist = unstable_cache(
  async (id: string) => {
    const { data, error } = await supabase
      .from("setlists")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data as Setlist;
  },
  ["setlist-detail"],
  { tags: ["setlists"], revalidate: 30 }
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const setlist = await getSetlist(id);

  if (!setlist) {
    return { title: "Setlist not found" };
  }

  const date = new Date(setlist.date + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const branch = getBranchLabel(setlist.branch);

  const title = `Worship Lineup — ${date} — ${branch}${setlist.title ? ` — ${setlist.title}` : ""}`;

  const description = setlist.song_leader
    ? `Song leader: ${setlist.song_leader}`
    : "Agham worship team lineup";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

const fetchSectionsBySetlistId = unstable_cache(
  async (id: string) => {
    const { data, error } = await supabase
      .from("setlist_sections")
      .select(
        `
        *,
        songs (
          id,
          title,
          author,
          category,
          language,
          default_key,
          default_bpm,
          default_time_signature,
          lyrics,
          chords,
          status
        )
      `
      )
      .eq("setlist_id", id)
      .order("sort_order", { ascending: true });

    if (error) return [];
    return data as unknown as SetlistSectionWithSong[];
  },
  ["setlist-sections"],
  { tags: ["setlists"], revalidate: 30 }
);

export default async function SetlistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [setlist, sections] = await Promise.all([
    getSetlist(id),
    fetchSectionsBySetlistId(id),
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
    <SetlistDetail
      id={id}
      initialSetlist={setlist}
      initialSections={sections}
      isPast={isPast}
    />
  );
}
