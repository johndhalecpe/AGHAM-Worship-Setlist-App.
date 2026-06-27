"use client";

import { useState, useEffect } from "react";
import { Song } from "@/lib/type";
import SongSearchList from "@/components/setlists/song-picker/SongSearchList";
import NewSongForm from "@/components/setlists/song-picker/NewSongForm";

type SongPickerProps = {
  setlistId: string;
  sectionType: string;
  onSongAdded: () => void;
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

  const filteredSongs = allSongs.filter((song) => {
    if (search.trim() === "") return false;
    const matchesSearch = song.title
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === null || song.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  function handleSearchInput(value: string) {
    setSearch(value);
    setShowNewSongForm(false);
  }

  async function handleSelectSong(songId: string) {
    setLoading(true);

    await fetch(`/api/setlists/${setlistId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        song_id: songId,
        section_type: sectionType,
      }),
    });

    setLoading(false);
    setSearch("");
    onSongAdded();
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
        value={search}
        onChange={(e) => handleSearchInput(e.target.value)}
        placeholder="Search song title..."
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
      {filteredSongs.length > 0 && (
        <SongSearchList
          songs={filteredSongs}
          loading={loading}
          onSelect={handleSelectSong}
        />
      )}
      {search.trim() !== "" && filteredSongs.length === 0 && !showNewSongForm && (
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
          onCreated={() => {
            setSearch("");
            setShowNewSongForm(false);
            onSongAdded();
          }}
          onCancel={() => setShowNewSongForm(false)}
        />
      )}
    </div>
  );
}
