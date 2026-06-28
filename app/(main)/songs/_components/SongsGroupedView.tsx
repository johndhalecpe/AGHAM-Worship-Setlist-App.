"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Song } from "@/lib/type";
import SongCard from "@/components/songs/SongCard";
import SongsSearchBar from "./SongsSearchBar";
import EditSongModal from "./EditSongModal";

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

export default function SongsGroupedView({ songs }: { songs: Song[] }) {
  const router = useRouter();
  const [isLocked, setIsLocked] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const searchMatches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return null;
    const title: Song[] = [];
    const author: Song[] = [];
    const lyrics: Song[] = [];
    for (const song of songs) {
      const lowerTitle = song.title.toLowerCase();
      const lowerAuthor = (song.author ?? "").toLowerCase();
      const lowerLyrics = (song.lyrics ?? "").toLowerCase();
      if (lowerTitle.includes(query)) {
        title.push(song);
      } else if (lowerAuthor.includes(query)) {
        author.push(song);
      } else if (lowerLyrics.includes(query)) {
        lyrics.push(song);
      }
    }
    return { title, author, lyrics };
  }, [songs, searchQuery]);

  const editingSong = useMemo(() => songs.find((s) => s.id === editingId) ?? null, [songs, editingId]);
  const hasSearch = searchMatches !== null;
  const groups = hasSearch ? [] : groupSongsByCategoryAndLanguage(songs);

  async function handleSave(songId: string, data: { title: string; author: string; category: string; language: string; default_key: string; default_bpm: number; default_time_signature: string; lyrics: string }) {
    setIsSaving(true);
    await fetch(`/api/songs/${songId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setIsSaving(false);
    setEditingId(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        className="rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap"
        style={{
          backgroundColor: "var(--color-surface-muted)",
          border: "1px solid var(--color-border)",
        }}
      >
        {isLocked ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0" style={{ color: "var(--color-text-tertiary)" }}>
            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0" style={{ color: "#D84F0B" }}>
            <path fillRule="evenodd" d="M14.5 1A4.5 4.5 0 0 0 10 5.5V9H3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 14.5 1Zm-3 8V5.5a3 3 0 1 1 6 0V9h-6Z" clipRule="evenodd" />
          </svg>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
            {isLocked ? "Song library is locked" : "Song library is unlocked"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>
            {isLocked ? "Unlock to edit or delete songs" : "Lock to prevent accidental changes"}
          </p>
        </div>
        <button
          onClick={() => setIsLocked(!isLocked)}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-all hover:-translate-y-0.5 shrink-0 w-full sm:w-auto min-h-[40px]"
          style={{
            backgroundColor: isLocked ? "#D84F0B" : "var(--color-surface-card)",
            color: isLocked ? "#fff" : "var(--color-text-secondary)",
            border: isLocked ? "none" : "1px solid var(--color-border)",
          }}
        >
          {isLocked ? "Unlock" : "Lock"}
        </button>
      </div>

      <SongsSearchBar value={searchQuery} onChange={setSearchQuery} />

      {hasSearch && (
        <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
          Found {searchMatches.title.length + searchMatches.author.length + searchMatches.lyrics.length} song{(searchMatches.title.length + searchMatches.author.length + searchMatches.lyrics.length) !== 1 ? "s" : ""}
          {" "}matching &quot;{searchQuery.trim()}&quot;
        </p>
      )}

      {hasSearch ? (
        <>
          {searchMatches.title.length > 0 && (
            <div>
              <h3 className="text-base font-bold mb-3" style={{ color: "var(--color-text)" }}>
                Found a song match
              </h3>
              <div className="flex flex-col gap-0.5">
                {searchMatches.title.map((song) => (
                  <SongCard key={song.id} song={song} isLocked={isLocked} onEditRequest={(id) => setEditingId(id)} />
                ))}
              </div>
            </div>
          )}
          {searchMatches.author.length > 0 && (
            <div>
              <h3 className="text-base font-bold mb-3" style={{ color: "var(--color-text)" }}>
                Found an author match
              </h3>
              <div className="flex flex-col gap-0.5">
                {searchMatches.author.map((song) => (
                  <SongCard key={song.id} song={song} isLocked={isLocked} onEditRequest={(id) => setEditingId(id)} />
                ))}
              </div>
            </div>
          )}
          {searchMatches.lyrics.length > 0 && (
            <div>
              <h3 className="text-base font-bold mb-3" style={{ color: "var(--color-text)" }}>
                Found a lyrics match
              </h3>
              <div className="flex flex-col gap-0.5">
                {searchMatches.lyrics.map((song) => (
                  <SongCard key={song.id} song={song} isLocked={isLocked} onEditRequest={(id) => setEditingId(id)} />
                ))}
              </div>
            </div>
          )}
          {searchMatches.title.length + searchMatches.author.length + searchMatches.lyrics.length === 0 && (
            <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
              No songs match your search.
            </p>
          )}
        </>
      ) : (
        <>
          {groups.map((group) => (
            <div key={group.category}>
              <h3 className="text-base font-bold mb-3" style={{ color: "var(--color-text)" }}>
                {CATEGORY_LABELS[group.category] ?? group.category}
              </h3>
              <div className="flex flex-col gap-4">
                {SORTED_LANGUAGES
                  .filter((lang) => group.songs[lang])
                  .map((lang) => (
                    <div key={lang}>
                      <h4 className="text-xs uppercase tracking-wider font-semibold mb-1.5" style={{ color: "var(--color-text-tertiary)" }}>
                        {LANGUAGE_LABELS[lang] ?? lang}
                      </h4>
                      <div className="flex flex-col gap-0.5">
                        {group.songs[lang].map((song) => (
                          <SongCard key={song.id} song={song} isLocked={isLocked} onEditRequest={(id) => setEditingId(id)} />
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
          {groups.length === 0 && (
            <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
              No songs yet. Add one above.
            </p>
          )}
        </>
      )}

      {editingSong && (
        <EditSongModal
          song={editingSong}
          onSave={(data) => handleSave(editingSong.id, data)}
          onCancel={() => setEditingId(null)}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
