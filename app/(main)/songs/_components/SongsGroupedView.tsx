"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
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

const CATEGORY_FILTERS = ["worship", "praise", "other", "draft"] as const;
const LANGUAGE_FILTERS = ["english", "filipino"] as const;
const TIME_SIG_FILTERS = ["4/4", "3/4", "6/8"] as const;

export default function SongsGroupedView({ songs }: { songs: Song[] }) {
  const router = useRouter();
  const [isLocked, setIsLocked] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(new Set());
  const [selectedTimeSigs, setSelectedTimeSigs] = useState<Set<string>>(new Set());
  const [composedOnly, setComposedOnly] = useState(false);

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

  const filteredSongs = useMemo(() => {
    let result = songs;

    if (selectedCategory === "draft") {
      result = result.filter((s) => s.status === "draft");
    } else if (selectedCategory) {
      result = result.filter((s) => s.category === selectedCategory);
    }

    if (composedOnly) {
      result = result.filter((s) => (s.author ?? "").toLowerCase() === "kenneth acebuche");
    }

    if (selectedLanguages.size > 0) {
      result = result.filter((s) => s.language && selectedLanguages.has(s.language));
    }

    if (selectedTimeSigs.size > 0) {
      result = result.filter((s) => s.default_time_signature && selectedTimeSigs.has(s.default_time_signature));
    }

    return result;
  }, [songs, selectedCategory, composedOnly, selectedLanguages, selectedTimeSigs]);

  const editingSong = useMemo(() => songs.find((s) => s.id === editingId) ?? null, [songs, editingId]);
  const hasSearch = searchMatches !== null;
  const groups = hasSearch ? [] : groupSongsByCategoryAndLanguage(filteredSongs);

  function toggleLanguage(lang: string) {
    setSelectedLanguages((prev) => {
      const next = new Set(prev);
      if (next.has(lang)) next.delete(lang);
      else next.add(lang);
      return next;
    });
  }

  function toggleTimeSig(ts: string) {
    setSelectedTimeSigs((prev) => {
      const next = new Set(prev);
      if (next.has(ts)) next.delete(ts);
      else next.add(ts);
      return next;
    });
  }

  function handleCategoryClick(cat: string) {
    if (selectedCategory === cat) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(cat);
    }
  }

  function clearFilters() {
    setSelectedCategory(null);
    setSelectedLanguages(new Set());
    setSelectedTimeSigs(new Set());
    setComposedOnly(false);
    setShowFilters(false);
  }

  async function handleSave(songId: string, data: {
    title: string;
    author: string;
    category: string;
    language: string;
    default_key: string;
    default_bpm: number | null;
    default_time_signature: string;
    lyrics: string;
    chords: string;
  }) {
    setIsSaving(true);
    const res = await fetch(`/api/songs/${songId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      toast.error("Failed to save song");
      setIsSaving(false);
      return;
    }
    toast.success("Song saved");
    setIsSaving(false);
    setEditingId(null);
    router.refresh();
  }

  const hasActiveFilters = selectedCategory !== null || composedOnly || selectedLanguages.size > 0 || selectedTimeSigs.size > 0;

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
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/songs/new"
            className="rounded-lg px-3 py-2 text-sm font-medium transition-all hover:-translate-y-0.5 min-h-[40px] flex items-center"
            style={{
              backgroundColor: "#D84F0B",
              color: "var(--color-text-on-accent)",
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            Add a song
          </Link>
          <button
            onClick={() => setIsLocked(!isLocked)}
            className="rounded-lg px-3 py-2 text-sm font-medium transition-all hover:-translate-y-0.5 min-h-[40px]"
            style={{
              backgroundColor: isLocked ? "#D84F0B" : "var(--color-surface-card)",
              color: isLocked ? "#fff" : "var(--color-text-secondary)",
              border: isLocked ? "none" : "1px solid var(--color-border)",
            }}
          >
            {isLocked ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1 inline-block align-text-bottom">
                  <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                </svg>
                Unlock
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1 inline-block align-text-bottom">
                  <path fillRule="evenodd" d="M14.5 1A4.5 4.5 0 0 0 10 5.5V9H3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 14.5 1Zm-3 8V5.5a3 3 0 1 1 6 0V9h-6Z" clipRule="evenodd" />
                </svg>
                Lock
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <SongsSearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="rounded-lg px-3 py-2 text-sm font-medium transition-all shrink-0 min-h-[40px] flex items-center gap-1.5"
          style={{
            backgroundColor: showFilters || hasActiveFilters ? "#D84F0B" : "var(--color-surface-card)",
            color: showFilters || hasActiveFilters ? "#fff" : "var(--color-text-secondary)",
            border: showFilters || hasActiveFilters ? "none" : "1px solid var(--color-border)",
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74Z" clipRule="evenodd" />
          </svg>
          {hasActiveFilters && (
            <span className="text-xs bg-white/20 rounded-full px-1.5 py-0.5">
              {[selectedCategory, ...(selectedLanguages.size > 0 ? ["Lang"] : []), ...(selectedTimeSigs.size > 0 ? ["Time"] : [])].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div
          className="rounded-xl p-3 flex flex-col gap-2 relative"
          style={{
            backgroundColor: "var(--color-surface-muted)",
            border: "1px solid var(--color-border)",
          }}
        >
          <button
            onClick={() => setShowFilters(false)}
            className="absolute top-2 right-2 p-0.5 rounded transition-colors hover:opacity-80"
            style={{ color: "var(--color-text-tertiary)" }}
            aria-label="Close filters"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>

          <div>
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>
              Category
            </span>
            <div className="flex gap-1.5 mt-1 flex-wrap">
              {CATEGORY_FILTERS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className="rounded-lg px-2.5 py-1 text-xs font-medium transition-all"
                  style={{
                    backgroundColor: selectedCategory === cat ? "#D84F0B" : "var(--color-surface-card)",
                    color: selectedCategory === cat ? "#fff" : "var(--color-text-secondary)",
                    border: selectedCategory === cat ? "1px solid #D84F0B" : "1px solid var(--color-border)",
                  }}
                >
                  {cat === "worship" ? "Worship" : cat === "praise" ? "Praise" : cat === "other" ? "Other" : "Draft"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>
              Language
            </span>
            <div className="flex gap-1.5 mt-1">
              {LANGUAGE_FILTERS.map((lang) => (
                <button
                  key={lang}
                  onClick={() => toggleLanguage(lang)}
                  className="rounded-lg px-2.5 py-1 text-xs font-medium transition-all"
                  style={{
                    backgroundColor: selectedLanguages.has(lang) ? "#D84F0B" : "var(--color-surface-card)",
                    color: selectedLanguages.has(lang) ? "#fff" : "var(--color-text-secondary)",
                    border: selectedLanguages.has(lang) ? "1px solid #D84F0B" : "1px solid var(--color-border)",
                  }}
                >
                  {LANGUAGE_LABELS[lang]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>
              Author
            </span>
            <div className="flex gap-1.5 mt-1">
              <button
                onClick={() => setComposedOnly(!composedOnly)}
                className="rounded-lg px-2.5 py-1 text-xs font-medium transition-all"
                style={{
                  backgroundColor: composedOnly ? "#D84F0B" : "var(--color-surface-card)",
                  color: composedOnly ? "#fff" : "var(--color-text-secondary)",
                  border: composedOnly ? "1px solid #D84F0B" : "1px solid var(--color-border)",
                }}
              >
                Composed
              </button>
            </div>
          </div>

          <div>
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>
              Time Signature
            </span>
            <div className="flex gap-1.5 mt-1">
              {TIME_SIG_FILTERS.map((ts) => (
                <button
                  key={ts}
                  onClick={() => toggleTimeSig(ts)}
                  className="rounded-lg px-2.5 py-1 text-xs font-medium transition-all"
                  style={{
                    backgroundColor: selectedTimeSigs.has(ts) ? "#D84F0B" : "var(--color-surface-card)",
                    color: selectedTimeSigs.has(ts) ? "#fff" : "var(--color-text-secondary)",
                    border: selectedTimeSigs.has(ts) ? "1px solid #D84F0B" : "1px solid var(--color-border)",
                  }}
                >
                  {ts}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-medium self-start rounded-lg px-2.5 py-1 transition-colors"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {!hasSearch && hasActiveFilters && (
        <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
          {filteredSongs.length} song{filteredSongs.length !== 1 ? "s" : ""}
          {selectedCategory ? ` in ${CATEGORY_LABELS[selectedCategory] ?? selectedCategory}` : ""}
          {selectedLanguages.size > 0 ? ` (${[...selectedLanguages].map((l) => LANGUAGE_LABELS[l]).join(", ")})` : ""}
          {selectedTimeSigs.size > 0 ? ` (${[...selectedTimeSigs].join(", ")} time)` : ""}
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
      ) : selectedCategory === "draft" ? (
        <>
          {filteredSongs.length > 0 ? (
            <div className="flex flex-col gap-0.5">
              {filteredSongs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  isLocked={isLocked}
                  onEditRequest={(id) => setEditingId(id)}
                  showMissingTags
                />
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
              No draft songs.
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