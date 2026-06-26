import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Song } from "@/lib/type";
import SongCard from "@/components/songs/SongCard";

export const dynamic = "force-dynamic";

const categoryPriority = ["worship", "praise"];
const categoryLabels: Record<string, string> = {
  worship: "Worship",
  praise: "Praise",
  other: "Other",
};
const languageLabels: Record<string, string> = {
  english: "English",
  filipino: "Filipino",
};
const languageOrder = ["english", "filipino"];

type Group = {
  category: string;
  songs: Record<string, Song[]>;
};

function buildGroups(songs: Song[]): Group[] {
  const valid = songs.filter((s) => s.category !== null && s.language !== null);
  const groups: Group[] = [];

  for (const cat of categoryPriority) {
    const byLang: Record<string, Song[]> = {};
    for (const song of valid) {
      if (song.category === cat) {
        const lang = song.language!;
        if (!byLang[lang]) byLang[lang] = [];
        byLang[lang].push(song);
      }
    }
    if (Object.keys(byLang).length > 0) {
      groups.push({ category: cat, songs: byLang });
    }
  }

  const otherByLang: Record<string, Song[]> = {};
  for (const song of valid) {
    if (!categoryPriority.includes(song.category!)) {
      const lang = song.language!;
      if (!otherByLang[lang]) otherByLang[lang] = [];
      otherByLang[lang].push(song);
    }
  }
  if (Object.keys(otherByLang).length > 0) {
    groups.push({ category: "other", songs: otherByLang });
  }

  return groups;
}

async function getSongs(): Promise<Song[]> {
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
  const songs = await getSongs();
  const groups = buildGroups(songs);

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
              {categoryLabels[group.category] ?? group.category}
            </h3>
            <div className="flex flex-col gap-4">
              {languageOrder
                .filter((lang) => group.songs[lang])
                .map((lang) => (
                  <div key={lang}>
                    <h4
                      className="text-xs uppercase tracking-wider font-semibold mb-1.5"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      {languageLabels[lang] ?? lang}
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
