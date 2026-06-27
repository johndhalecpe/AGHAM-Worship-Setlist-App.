import Link from "next/link";
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2
          className="text-xl sm:text-2xl font-bold"
          style={{ color: "var(--color-text)" }}
        >
          Song Library
        </h2>
        <Link
          href="/songs/new"
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-center transition-all hover:-translate-y-0.5 w-full sm:w-auto"
          style={{
            backgroundColor: "#D84F0B",
            color: "var(--color-surface-card)",
          }}
        >
          Add a song
        </Link>
      </div>
      <SongsGroupedView songs={songs} />
    </div>
  );
}
