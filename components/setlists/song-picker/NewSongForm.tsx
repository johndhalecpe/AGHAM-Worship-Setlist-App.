"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Song, SetlistSectionWithSong } from "@/lib/type";
import KeyPicker from "@/components/ui/KeyPicker";

type NewSongFormProps = {
  initialTitle: string;
  sectionType: string;
  setlistId: string;
  onCreated: (newSection: SetlistSectionWithSong) => void;
  onCancel: () => void;
};

const SECTION_TO_CATEGORY: Record<string, string | null> = {
  worship: "worship",
  praise: "praise",
  tithes_offering: null,
  special: null,
};

export default function NewSongForm({ initialTitle, sectionType, setlistId, onCreated, onCancel }: NewSongFormProps) {
  const [newTitle, setNewTitle] = useState(initialTitle);
  const [newAuthor, setNewAuthor] = useState("");
  const [newCategory, setNewCategory] = useState("worship");
  const [newLanguage, setNewLanguage] = useState("english");
  const [customCategory, setCustomCategory] = useState("");
  const [defaultKey, setDefaultKey] = useState("");
  const [defaultBpm, setDefaultBpm] = useState<number | null>(null);
  const [defaultTimeSignature, setDefaultTimeSignature] = useState("");
  const [loading, setLoading] = useState(false);
  const [authors, setAuthors] = useState<string[]>([]);
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);
  const [highlightedSuggestion, setHighlightedSuggestion] = useState(-1);
  const authorRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/songs")
      .then((res) => res.json())
      .then((songs: Song[]) => {
        const unique = new Set<string>();
        for (const song of songs) {
          if (song.author) unique.add(song.author);
        }
        setAuthors(Array.from(unique).sort());
      });
  }, []);

  const authorSuggestions = newAuthor.trim()
    ? authors.filter((a) =>
        a.toLowerCase().includes(newAuthor.toLowerCase())
      )
    : authors;

  function pickAuthor(author: string) {
    setNewAuthor(author);
    setShowAuthorSuggestions(false);
    setHighlightedSuggestion(-1);
  }

  function handleAuthorKeyDown(e: React.KeyboardEvent) {
    if (!showAuthorSuggestions || authorSuggestions.length === 0) {
      if (e.key === "Enter") handleCreateAndAddNewSong();
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
        default_key: defaultKey || null,
        default_bpm: defaultBpm,
        default_time_signature: defaultTimeSignature || null,
      }),
    });

    if (!songResponse.ok) {
      toast.error("Failed to create song");
      setLoading(false);
      return;
    }

    const newSong = await songResponse.json();

    const sectionRes = await fetch(`/api/setlists/${setlistId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        song_id: newSong.id,
        section_type: sectionType,
      }),
    });

    if (!sectionRes.ok) {
      toast.error("Failed to add song to lineup");
      setLoading(false);
      return;
    }

    const newSection: SetlistSectionWithSong = await sectionRes.json();

    toast.success("Song added");
    setLoading(false);
    onCreated(newSection);
  }

  return (
    <div className="flex flex-col gap-3 mt-3">
      <input
        type="text"
        name="inline-new-song-title"
        autoComplete="off"
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
            (e.target.style.borderColor = "var(--color-accent)")
          }
          onBlur={(e) =>
            e.target.style.borderColor = "var(--color-border)"
          }
      />
      <div className="relative">
        <input
          ref={authorRef}
          type="text"
          name="inline-new-song-author"
          autoComplete="off"
          value={newAuthor}
          onChange={(e) => {
            setNewAuthor(e.target.value);
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
          placeholder="Author (optional)"
          className="w-full rounded-lg px-3 py-2 text-sm transition-colors"
          style={{
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface-card)",
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
            {authorSuggestions.map((author, i) => (
              <button
                key={author}
                type="button"
                onMouseDown={() => pickAuthor(author)}
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
                {author}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        {(["worship", "praise", "other"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setNewCategory(opt)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all flex-1"
            style={{
              backgroundColor:
                newCategory === opt
                  ? "var(--color-accent)"
                  : "var(--color-surface)",
              color:
                newCategory === opt
                  ? "#fff"
                  : "var(--color-text-secondary)",
              border:
                newCategory === opt
                  ? "1px solid var(--color-accent)"
                  : "1px solid var(--color-border)",
            }}
          >
            {opt === "worship" ? "Worship" : opt === "praise" ? "Praise" : "Other"}
          </button>
        ))}
      </div>
      {newCategory === "other" && (
        <input
          type="text"
          name="inline-new-song-category"
          autoComplete="off"
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
            (e.target.style.borderColor = "var(--color-accent)")
          }
          onBlur={(e) =>
            (e.target.style.borderColor = "var(--color-border)")
          }
        />
      )}
      <div>
        <span
          className="text-xs font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Language
        </span>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {(["english", "filipino"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setNewLanguage(lang)}
              className="rounded-lg px-3 py-2 text-sm font-medium transition-all text-left"
              style={{
                backgroundColor: newLanguage === lang ? "var(--color-accent)" : "var(--color-surface)",
                color: newLanguage === lang ? "#fff" : "var(--color-text-secondary)",
                border: newLanguage === lang ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
              }}
            >
              {lang === "english" ? "English" : "Filipino"}
            </button>
          ))}
        </div>
      </div>
      <div className="border-t" style={{ borderColor: "var(--color-border)" }} />
      <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>
        Details <span className="font-normal normal-case opacity-70">(optional)</span>
      </p>
      <div>
        <label className="text-xs font-medium" style={{ color: "var(--color-text)" }}>
          Key
        </label>
        <KeyPicker value={defaultKey} onChange={setDefaultKey} />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs font-medium" style={{ color: "var(--color-text)" }}>
            BPM
          </label>
          <input
            type="number"
            name="inline-new-song-bpm"
            autoComplete="off"
            value={defaultBpm ?? ""}
            onChange={(e) => setDefaultBpm(e.target.value ? Number(e.target.value) : null)}
            placeholder="120"
            className="w-full rounded-lg px-3 py-1.5 text-sm mt-1 transition-colors"
            style={{
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface-card)",
              color: "var(--color-text)",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium" style={{ color: "var(--color-text)" }}>
            Time
          </label>
          <div className="flex gap-1 mt-1">
            {["4/4", "3/4", "6/8"].map((ts) => (
              <button
                key={ts}
                type="button"
                onClick={() => setDefaultTimeSignature(ts === defaultTimeSignature ? "" : ts)}
                className="rounded-lg px-2 py-1.5 text-xs font-medium transition-all flex-1"
                style={{
                  backgroundColor:
                    defaultTimeSignature === ts
                      ? "var(--color-accent)"
                      : "var(--color-surface)",
                  color:
                    defaultTimeSignature === ts
                      ? "#fff"
                      : "var(--color-text-secondary)",
                  border:
                    defaultTimeSignature === ts
                      ? "1px solid var(--color-accent)"
                      : "1px solid var(--color-border)",
                }}
              >
                {ts}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button
        onClick={handleCreateAndAddNewSong}
        disabled={loading}
        className="rounded-lg px-4 py-2 text-sm font-medium transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
        style={{
          backgroundColor: "var(--color-accent)",
          color: "var(--color-text-on-accent)",
        }}
      >
        {loading ? "Adding..." : "Add song"}
      </button>
    </div>
  );
}