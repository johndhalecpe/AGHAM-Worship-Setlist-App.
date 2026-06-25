"use client";

import { useState } from "react";
import { Song } from "@/lib/type";

type Props = {
  setlistId: string;
  sectionType: string;
  onSongAdded: () => void;
  onCancel: () => void;
};

export default function SongPicker({
  setlistId,
  sectionType,
  onSongAdded,
  onCancel,
}: Props) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewSongForm, setShowNewSongForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newCategory, setNewCategory] = useState("worship");
  const [newLanguage, setNewLanguage] = useState("english");
  const [customCategory, setCustomCategory] = useState("");

  async function handleSearch(value: string) {
    setSearch(value);
    setShowNewSongForm(false);

    if (value.trim() === "") {
      setResults([]);
      return;
    }

    const res = await fetch(`/api/songs?search=${encodeURIComponent(value)}`);
    const data = await res.json();
    setResults(data);
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
    onSongAdded();
  }

  async function handleAddNewSong() {
    if (!newTitle) return;
    setLoading(true);

    const finalCategory =
      newCategory === "other" ? customCategory : newCategory;

    const songRes = await fetch("/api/songs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle,
        author: newAuthor,
        category: finalCategory,
        language: newLanguage,
      }),
    });

    const newSong = await songRes.json();

    await fetch(`/api/setlists/${setlistId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        song_id: newSong.id,
        section_type: sectionType,
      }),
    });

    setLoading(false);
    onSongAdded();
  }

  return (
    <div className="mt-3 bg-neutral-50 rounded-xl border border-neutral-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-neutral-700">
          Add a song
        </span>
        <button
          onClick={onCancel}
          className="text-neutral-400 hover:text-neutral-600 text-lg leading-none transition-colors"
        >
          ✕
        </button>
      </div>
      <input
        type="text"
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search song title..."
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      {results.length > 0 && (
        <div className="border border-neutral-200 rounded-lg mt-2 overflow-hidden">
          {results.map((song) => (
            <button
              key={song.id}
              onClick={() => handleSelectSong(song.id)}
              disabled={loading}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 border-b border-neutral-100 last:border-b-0 transition-colors"
            >
              <span className="font-medium text-neutral-900">
                {song.title}
              </span>
              {song.author && (
                <span className="text-neutral-400 ml-2">{song.author}</span>
              )}
            </button>
          ))}
        </div>
      )}
      {search.trim() !== "" && results.length === 0 && !showNewSongForm && (
        <button
          onClick={() => {
            setShowNewSongForm(true);
            setNewTitle(search);
          }}
          className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
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
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="text"
            value={newAuthor}
            onChange={(e) => setNewAuthor(e.target.value)}
            placeholder="Author (optional)"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="worship">Worship</option>
            <option value="praise">Praise</option>
            <option value="other">Other (specify)</option>
          </select>
          <div>
            <span className="text-sm text-neutral-600">Language</span>
            <div className="flex gap-3 mt-1">
              <label className="flex items-center gap-1.5 text-sm text-neutral-700">
                <input
                  type="radio"
                  name="pickerLanguage"
                  value="english"
                  checked={newLanguage === "english"}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                English
              </label>
              <label className="flex items-center gap-1.5 text-sm text-neutral-700">
                <input
                  type="radio"
                  name="pickerLanguage"
                  value="filipino"
                  checked={newLanguage === "filipino"}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
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
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          )}
          <button
            onClick={handleAddNewSong}
            disabled={loading}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Adding..." : "Add song"}
          </button>
        </div>
      )}
    </div>
  );
}
