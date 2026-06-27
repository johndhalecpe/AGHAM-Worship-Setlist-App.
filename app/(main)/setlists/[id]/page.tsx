import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import { Setlist, SetlistSectionWithSong } from "@/lib/type";
import SetlistDetail from "./SetlistDetail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const { data: setlist } = await supabase
    .from("setlists")
    .select("*")
    .eq("id", id)
    .single();

  if (!setlist) {
    return { title: "Setlist not found" };
  }

  const title = setlist.title
    ? `${setlist.date} — ${setlist.title}`
    : setlist.date;

  const description = setlist.song_leader
    ? `Song leader: ${setlist.song_leader}`
    : "Agham worship team lineup";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: `/api/og?id=${id}`, width: 1200, height: 630 }],
      type: "website",
    },
  };
}

async function fetchSetlistById(id: string) {
  const { data, error } = await supabase
    .from("setlists")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Setlist;
}

async function fetchSectionsBySetlistId(id: string) {
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
    fetchSetlistById(id),
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
