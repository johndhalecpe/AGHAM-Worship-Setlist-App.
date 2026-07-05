import { getAllSongs } from "@/lib/services/songsService";
import SongsGroupedView from "./_components/SongsGroupedView";

export const dynamic = "force-dynamic";

export default async function SongsPage() {
  const songs = await getAllSongs();

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
