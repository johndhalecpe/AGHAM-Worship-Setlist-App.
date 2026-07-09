import { supabase } from "@/lib/supabase";
import { SongListItem } from "@/lib/type";
import SongsGroupedView from "./_components/SongsGroupedView";

export const revalidate = 30;

async function fetchAllSongs(): Promise<SongListItem[]> {
  const { data, error } = await supabase
    .from("songs")
    .select("id, title, author, category, language, default_key, default_bpm, default_time_signature, status, created_at")
    .order("title", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export default async function SongsPage() {
  const songs = await fetchAllSongs();

  return (
    <div>
      <h2
        className="text-xl sm:text-2xl font-bold mb-6"
        style={{ color: "var(--color-text)" }}
      >
        Song Library
      </h2>
      <SongsGroupedView songs={songs} />
    </div>
  );
}
