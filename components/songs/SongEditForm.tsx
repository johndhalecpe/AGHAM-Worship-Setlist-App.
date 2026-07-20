"use client";

import { useState, useEffect, useRef } from "react";
import { Song } from "@/lib/type";
import MusicalDataSection from "@/components/songs/MusicalDataSection";


type SongEditFormProps = {
  song: Song;
  onSave: (data: {
    title: string;
    author: string;
    category: string;
    language: string;
    default_key: string;
    default_bpm: number | null;
    default_time_signature: string;
    lyrics: string;
    chords: string;
  }) => void;
  onCancel: () => void;
  isSaving: boolean;
};

const categoryLabels: Record<string, string> = {
  worship: "Worship",
  praise: "Praise",
  altar_call: "Altar Call",
};

const languageOptions = ["english", "filipino"] as const;
const languageLabels: Record<string, string> = {
  english: "English",
  filipino: "Filipino",
};

function isPredefinedCategory(cat: string | null): cat is keyof typeof categoryLabels {
  return cat !== null && cat in categoryLabels;
}

export default function SongEditForm({ song, onSave, onCancel, isSaving }: SongEditFormProps) {
  const [title, setTitle] = useState(song.title);
  const [author, setAuthor] = useState(song.author ?? "");
  const [category, setCategory] = useState(
    isPredefinedCategory(song.category) ? song.category : "other"
  );
  const [customCategory, setCustomCategory] = useState(
    isPredefinedCategory(song.category) ? "" : (song.category ?? "")
  );
  const [language, setLanguage] = useState(song.language ?? "english");
  const [defaultKey, setDefaultKey] = useState(song.default_key ?? "");
  const [defaultBpm, setDefaultBpm] = useState(song.default_bpm);
  const [defaultTimeSignature, setDefaultTimeSignature] = useState(song.default_time_signature ?? "");
  const [lyrics, setLyrics] = useState(song.lyrics ?? "");
  const [chords, setChords] = useState(song.chords ?? "");
  const [authors, setAuthors] = useState<string[]>([]);
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);
  const [highlightedSuggestion, setHighlightedSuggestion] = useState(-1);
  const authorRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/songs/authors")
      .then((res) => res.json())
      .then(setAuthors);
  }, []);

  const authorSuggestions = author.trim()
    ? authors.filter((a) =>
        a.toLowerCase().includes(author.toLowerCase())
      )
    : authors;

  function pickAuthor(name: string) {
    setAuthor(name);
    setShowAuthorSuggestions(false);
    setHighlightedSuggestion(-1);
  }

  function handleAuthorKeyDown(e: React.KeyboardEvent) {
    if (!showAuthorSuggestions || authorSuggestions.length === 0) {
      if (e.key === "Enter") handleSave();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedSuggestion((prev) =>
        prev < authorSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedSuggestion((prev) =>
        prev > 0 ? prev - 1 : authorSuggestions.length - 1
      );
    } else if (e.key === "Enter" && highlightedSuggestion >= 0) {
      e.preventDefault();
      pickAuthor(authorSuggestions[highlightedSuggestion]);
    } else if (e.key === "Escape") {
      setShowAuthorSuggestions(false);
      setHighlightedSuggestion(-1);
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        authorRef.current &&
        !authorRef.current.contains(e.target as Node) &&
        suggestionRef.current &&
        !suggestionRef.current.contains(e.target as Node)
      ) {
        setShowAuthorSuggestions(false);
        setHighlightedSuggestion(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSave() {
    if (!title) return;
    const resolvedCategory = category === "other" ? customCategory : category;
    onSave({
      title,
      author,
      category: resolvedCategory,
      language,
      default_key: defaultKey,
      default_bpm: defaultBpm,
      default_time_signature: defaultTimeSignature,
      lyrics,
      chords,
    });
  }

  return (
    <div className="w-full flex flex-col gap-3">
      <input
        type="text"
        name="song-edit-title"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        autoCapitalize="off"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Lihim"
        className="w-full rounded-lg px-3 py-2 text-sm"
        style={{
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text)",
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
      />
      <div className="relative">
        <input
          ref={authorRef}
          type="text"
          name="song-edit-author"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoCapitalize="off"
          value={author}
          onChange={(e) => {
            setAuthor(e.target.value);
            setShowAuthorSuggestions(true);
            setHighlightedSuggestion(-1);
          }}
          onFocus={(e) => {
            setShowAuthorSuggestions(true);
            e.target.style.borderColor = "var(--color-accent)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "var(--color-border)";
          }}
          onKeyDown={handleAuthorKeyDown}
          placeholder="e.g. Kenneth Acebuche"
          className="w-full rounded-lg px-3 py-2 text-sm"
          style={{
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text)",
          }}
        />
        {showAuthorSuggestions && authorSuggestions.length > 0 && (
          <div
            ref={suggestionRef}
            className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg overflow-hidden shadow-lg"
            style={{
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface-card)",
            }}
          >
            {authorSuggestions.map((name, i) => (
              <button
                key={name}
                type="button"
                onMouseDown={() => pickAuthor(name)}
                onMouseEnter={() => setHighlightedSuggestion(i)}
                className="w-full text-left px-3 py-2 text-sm transition-colors"
                style={{
                  backgroundColor:
                    i === highlightedSuggestion
                      ? "var(--color-surface-elevated)"
                      : "transparent",
                  color: "var(--color-text)",
                }}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        {(["worship", "praise", "altar_call", "other"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setCategory(opt)}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-all flex-1"
            style={{
              backgroundColor:
                category === opt
                  ? "var(--color-accent)"
                  : "var(--color-surface)",
              color:
                category === opt
                  ? "#fff"
                  : "var(--color-text-secondary)",
              border:
                category === opt
                  ? "1px solid var(--color-accent)"
                  : "1px solid var(--color-border)",
            }}
          >
            {opt === "worship" ? "Worship" : opt === "praise" ? "Praise" : opt === "altar_call" ? "Altar Call" : "Other"}
          </button>
        ))}
      </div>
      {category === "other" && (
        <input
          type="text"
          name="song-edit-category"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoCapitalize="off"
          value={customCategory}
          onChange={(e) => setCustomCategory(e.target.value)}
          placeholder="Specify category"
          className="w-full rounded-lg px-3 py-2 text-sm"
          style={{
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text)",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
        />
      )}
      <div>
        <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
          Language
        </span>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {languageOptions.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              className="rounded-lg px-3 py-2 text-sm font-medium transition-all text-left"
              style={{
                backgroundColor: language === lang ? "var(--color-accent)" : "var(--color-surface)",
                color: language === lang ? "#fff" : "var(--color-text-secondary)",
                border: language === lang ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
              }}
            >
              {languageLabels[lang]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
          Lyrics
        </label>
        <textarea
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          placeholder="Enter song lyrics..."
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoCapitalize="off"
          rows={8}
          className="w-full rounded-lg px-3 py-2.5 text-sm mt-1.5 transition-colors"
          style={{
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text)",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
        />
      </div>
      <div className="border-t pt-3" style={{ borderColor: "var(--color-border)" }}>
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>
          Musical Data <span className="font-normal normal-case opacity-70">· leave this to a staff or admin (optional)</span>
        </p>
      </div>
      <div>
        <label className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
          Chords
        </label>
        <textarea
          value={chords}
          onChange={(e) => setChords(e.target.value)}
          placeholder="Enter chord chart..."
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoCapitalize="off"
          rows={8}
          className="w-full rounded-lg px-3 py-2.5 text-sm mt-1.5 transition-colors"
          style={{
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text)",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
        />
      </div>
      <MusicalDataSection
        defaultKey={defaultKey}
        defaultBpm={defaultBpm}
        defaultTimeSignature={defaultTimeSignature}
        onKeyChange={setDefaultKey}
        onBpmChange={setDefaultBpm}
        onTimeSignatureChange={setDefaultTimeSignature}
      />
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-sm font-medium"
          style={{
            border: "1px solid var(--color-border)",
            color: "var(--color-text-secondary)",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || !title}
          className="rounded-lg px-3 py-1.5 text-sm font-medium transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          style={{
            backgroundColor: "var(--color-accent)",
            color: "var(--color-text-on-accent)",
          }}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}