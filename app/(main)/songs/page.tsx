import { supabase } from "@/lib/supabase";
import { Song } from "@/lib/type";
import SongsGroupedView from "./_components/SongsGroupedView";

export const dynamic = "force-dynamic";

async function fetchAllSongs(): Promise<Song[]> {
  const { data, error } = await supabase
    .from("songs")
    .select("*")
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
