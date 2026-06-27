import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Song } from "@/lib/type";
import SongCard from "@/components/songs/SongCard";

export const dynamic = "force-dynamic";

const PRIORITY_CATEGORIES = ["worship", "praise"];
const CATEGORY_LABELS: Record<string, string> = {
  worship: "Worship",
  praise: "Praise",
  other: "Other",
};
const LANGUAGE_LABELS: Record<string, string> = {
  english: "English",
  filipino: "Filipino",
};
const SORTED_LANGUAGES = ["english", "filipino"];

type Group = {
  category: string;
  songs: Record<string, Song[]>;
};

function groupSongsByCategoryAndLanguage(songs: Song[]): Group[] {
  const songsWithCategoryAndLanguage = songs.filter(
    (s) => s.category !== null && s.language !== null
  );
  const songGroups: Group[] = [];

  for (const category of PRIORITY_CATEGORIES) {
    const songsByLanguage: Record<string, Song[]> = {};
    for (const song of songsWithCategoryAndLanguage) {
      if (song.category === category) {
        const lang = song.language!;
        if (!songsByLanguage[lang]) songsByLanguage[lang] = [];
        songsByLanguage[lang].push(song);
      }
    }
    if (Object.keys(songsByLanguage).length > 0) {
      songGroups.push({ category, songs: songsByLanguage });
    }
  }

  const otherSongsByLanguage: Record<string, Song[]> = {};
  for (const song of songsWithCategoryAndLanguage) {
    if (!PRIORITY_CATEGORIES.includes(song.category!)) {
      const lang = song.language!;
      if (!otherSongsByLanguage[lang]) otherSongsByLanguage[lang] = [];
      otherSongsByLanguage[lang].push(song);
    }
  }
  if (Object.keys(otherSongsByLanguage).length > 0) {
    songGroups.push({ category: "other", songs: otherSongsByLanguage });
  }

  return songGroups;
}

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
  const groups = groupSongsByCategoryAndLanguage(songs);

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
      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <div key={group.category}>
            <h3
              className="text-base font-bold mb-3"
              style={{ color: "var(--color-text)" }}
            >
              {CATEGORY_LABELS[group.category] ?? group.category}
            </h3>
            <div className="flex flex-col gap-4">
              {SORTED_LANGUAGES
                .filter((lang) => group.songs[lang])
                .map((lang) => (
                  <div key={lang}>
                    <h4
                      className="text-xs uppercase tracking-wider font-semibold mb-1.5"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      {LANGUAGE_LABELS[lang] ?? lang}
                    </h4>
                    <div className="flex flex-col gap-0.5">
                      {group.songs[lang].map((song) => (
                        <SongCard key={song.id} song={song} />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <p
            className="text-sm"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            No songs yet. Add one above.
          </p>
        )}
      </div>
    </div>
  );
}
