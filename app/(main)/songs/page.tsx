import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Song } from "@/lib/type";

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
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-neutral-900">Song Library</h2>
        <Link
          href="/songs/new"
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Add a song
        </Link>
      </div>
      <div className="flex flex-col gap-8">
        {groups.map((group) => (
          <div key={group.category}>
            <h3 className="text-lg font-bold text-neutral-900 mb-4">
              {categoryLabels[group.category] ?? group.category}
            </h3>
            <div className="flex flex-col gap-5">
              {languageOrder
                .filter((lang) => group.songs[lang])
                .map((lang) => (
                  <div key={lang}>
                    <h4 className="text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2.5">
                      {languageLabels[lang] ?? lang}
                    </h4>
                    <div className="flex flex-col gap-2">
                      {group.songs[lang].map((song) => (
                        <div
                          key={song.id}
                          className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium text-neutral-900">
                              {song.title}
                            </p>
                            {song.author && (
                              <p className="text-sm text-neutral-400 mt-0.5">
                                {song.author}
                              </p>
                            )}
                          </div>
                          {group.category === "other" && song.category && (
                            <span className="text-xs text-blue-600 bg-blue-50 rounded-full px-2.5 py-0.5 font-medium">
                              {song.category}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <p className="text-neutral-400 text-sm">No songs yet. Add one above.</p>
        )}
      </div>
    </div>
  );
}
