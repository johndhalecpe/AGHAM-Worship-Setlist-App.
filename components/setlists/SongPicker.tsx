"use client";

import { useState, useEffect } from "react";
import { Song } from "@/lib/type";

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
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newCategory, setNewCategory] = useState("worship");
  const [newLanguage, setNewLanguage] = useState("english");
  const [customCategory, setCustomCategory] = useState("");

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

  async function handleCreateAndAddNewSong() {
    if (!newTitle) return;
    setLoading(true);

    const resolvedCategory =
      newCategory === "other" ? customCategory : newCategory;

    const songResponse = await fetch("/api/songs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle,
        author: newAuthor,
        category: resolvedCategory,
        language: newLanguage,
      }),
    });

    const newSong = await songResponse.json();

    await fetch(`/api/setlists/${setlistId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        song_id: newSong.id,
        section_type: sectionType,
      }),
    });

    setLoading(false);
    setSearch("");
    setShowNewSongForm(false);
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
        <div
          className="rounded-lg mt-2 overflow-hidden"
          style={{
            border: "1px solid var(--color-border)",
          }}
        >
          {filteredSongs.map((song) => (
            <div
              key={song.id}
              className="flex items-center gap-2 px-3 py-2 text-sm border-b last:border-b-0 transition-colors"
              style={{
                borderColor: "var(--color-border)",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor =
                  "var(--color-surface-elevated)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor =
                  "transparent")
              }
            >
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => handleSelectSong(song.id)}
              >
                <span className="font-medium">{song.title}</span>
                {song.author && (
                  <span
                    className="ml-2"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    {song.author}
                  </span>
                )}
              </div>
              <button
                onClick={() => handleSelectSong(song.id)}
                disabled={loading}
                className="shrink-0 p-1 rounded transition-colors hover:opacity-80 active:scale-95"
                style={{ color: "#D84F0B" }}
                aria-label={`Add ${song.title}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      {search.trim() !== "" && filteredSongs.length === 0 && !showNewSongForm && (
        <button
          onClick={() => {
            setShowNewSongForm(true);
            setNewTitle(search);
          }}
          className="mt-2 text-sm font-medium w-full text-left px-3 py-2 rounded-lg transition-colors"
          style={{ color: "#D84F0B" }}
        >
          + Add &ldquo;{search}&rdquo; as a new song
        </button>
      )}
      {showNewSongForm && (
        <div className="flex flex-col gap-3 mt-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Title"
            className="rounded-lg px-3 py-2 text-sm transition-colors"
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
          <input
            type="text"
            value={newAuthor}
            onChange={(e) => setNewAuthor(e.target.value)}
            placeholder="Author (optional)"
            className="rounded-lg px-3 py-2 text-sm transition-colors"
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
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm transition-colors"
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
          >
            <option value="worship">Worship</option>
            <option value="praise">Praise</option>
            <option value="other">Other (specify)</option>
          </select>
          <div>
            <span
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Language
            </span>
            <div className="flex gap-3 mt-1">
              <label
                className="flex items-center gap-1.5 text-sm"
                style={{ color: "var(--color-text)" }}
              >
                <input
                  type="radio"
                  name="pickerLanguage"
                  value="english"
                  checked={newLanguage === "english"}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  style={{ accentColor: "#D84F0B" }}
                />
                English
              </label>
              <label
                className="flex items-center gap-1.5 text-sm"
                style={{ color: "var(--color-text)" }}
              >
                <input
                  type="radio"
                  name="pickerLanguage"
                  value="filipino"
                  checked={newLanguage === "filipino"}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  style={{ accentColor: "#D84F0B" }}
                />
                Filipino
              </label>
            </div>
          </div>
          {newCategory === "other" && (
            <input
              type="text"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Describe the category"
              className="rounded-lg px-3 py-2 text-sm transition-colors"
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
          )}
          <button
            onClick={handleCreateAndAddNewSong}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
            style={{
              backgroundColor: "#D84F0B",
              color: "var(--color-surface-card)",
            }}
          >
            {loading ? "Adding..." : "Add song"}
          </button>
        </div>
      )}
    </div>
  );
}
