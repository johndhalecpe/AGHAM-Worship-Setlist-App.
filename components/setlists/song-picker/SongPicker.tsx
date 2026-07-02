"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Song, SetlistSectionWithSong } from "@/lib/type";
import SongSearchList from "@/components/setlists/song-picker/SongSearchList";
import NewSongForm from "@/components/setlists/song-picker/NewSongForm";

type SongPickerProps = {
  setlistId: string;
  sectionType: string;
  onSongAdded: (newSection: SetlistSectionWithSong) => void;
  onCancel: () => void;
};

const SECTION_TO_CATEGORY: Record<string, string | null> = {
  worship: "worship",
  praise: "praise",
  tithes_offering: null,
  special: null,
};

export default function SongPicker({
  setlistId,
  sectionType,
  onSongAdded,
  onCancel,
}: SongPickerProps) {
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewSongForm, setShowNewSongForm] = useState(false);

  useEffect(() => {
    fetch("/api/songs")
      .then((res) => res.json())
      .then(setAllSongs);
  }, []);

  const categoryFilter = SECTION_TO_CATEGORY[sectionType];

  const searchMatches = (() => {
    const query = search.trim().toLowerCase();
    if (!query) return null;
    const title: Song[] = [];
    const author: Song[] = [];
    const lyrics: Song[] = [];
    for (const song of allSongs) {
      if (categoryFilter !== null && song.category !== categoryFilter)
        continue;
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
  })();

  const hasMatches =
    searchMatches !== null &&
    (searchMatches.title.length > 0 ||
      searchMatches.author.length > 0 ||
      searchMatches.lyrics.length > 0);

  function handleSearchInput(value: string) {
    setSearch(value);
    setShowNewSongForm(false);
  }

  async function handleSelectSong(songId: string) {
    setLoading(true);

    const res = await fetch(`/api/setlists/${setlistId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        song_id: songId,
        section_type: sectionType,
      }),
    });

    if (!res.ok) {
      toast.error("Failed to add song to lineup");
      setLoading(false);
      return;
    }

    const newSection: SetlistSectionWithSong = await res.json();

    toast.success("Song added to lineup");
    setLoading(false);
    setSearch("");
    onSongAdded(newSection);
  }

  return (
    <div
      className="mt-3 rounded-xl p-4"
      style={{
        backgroundColor: "var(--color-surface-muted)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--color-text)" }}
        >
          Add a song
        </span>
        <button
          onClick={onCancel}
          className="text-lg leading-none transition-colors"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          ✕
        </button>
      </div>
      <input
        type="text"
        name="song-picker-search"
        autoComplete="off"
        value={search}
        onChange={(e) => handleSearchInput(e.target.value)}
        placeholder="Search by title, author, or lyrics..."
        className="w-full rounded-lg px-3 py-2 text-sm transition-colors"
        style={{
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--color-surface-card)",
          color: "var(--color-text)",
        }}
        onFocus={(e) =>
          (e.target.style.borderColor = "#D84F0B")
        }
        onBlur={(e) =>
          (e.target.style.borderColor = "var(--color-border)")
        }
      />

      {hasMatches && searchMatches && (
        <SongSearchList
          searchMatches={searchMatches}
          loading={loading}
          onSelect={handleSelectSong}
        />
      )}
      {search.trim() !== "" && !showNewSongForm && (
        <button
          onClick={() => {
            setShowNewSongForm(true);
          }}
          className="mt-2 text-sm font-medium w-full text-left px-3 py-2 rounded-lg transition-colors"
          style={{ color: "#D84F0B" }}
        >
          + Add &ldquo;{search}&rdquo; as a new song
        </button>
      )}
      {showNewSongForm && (
        <NewSongForm
          initialTitle={search}
          sectionType={sectionType}
          setlistId={setlistId}
          onCreated={(newSection) => {
            setSearch("");
            setShowNewSongForm(false);
            onSongAdded(newSection);
          }}
          onCancel={() => setShowNewSongForm(false)}
        />
      )}
    </div>
  );
}
