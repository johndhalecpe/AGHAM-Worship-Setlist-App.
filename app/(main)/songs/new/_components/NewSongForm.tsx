"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import MusicalDataSection from "@/components/songs/MusicalDataSection";

export default function NewSongForm() {
  const router = useRouter();
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("worship");
  const [language, setLanguage] = useState("english");
  const [customCategory, setCustomCategory] = useState("");
  const [defaultKey, setDefaultKey] = useState("");
  const [defaultBpm, setDefaultBpm] = useState<number | null>(null);
  const [defaultTimeSignature, setDefaultTimeSignature] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [chords, setChords] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
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
      if (e.key === "Enter") handleFormSubmit();
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

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  async function checkDuplicate(query: string): Promise<string | null> {
    try {
      const res = await fetch(`/api/songs?search=${encodeURIComponent(query)}`);
      const songs = await res.json();
      const match = songs.find(
        (s: { title: string }) => s.title.toLowerCase() === query.toLowerCase()
      );
      return match ? match.title : null;
    } catch {
      return null;
    }
  }

  useEffect(() => {
    if (!title.trim()) {
      setDuplicateWarning(null);
      return;
    }
    const timer = setTimeout(async () => {
      const existing = await checkDuplicate(title);
      setDuplicateWarning(existing);
    }, 400);
    return () => clearTimeout(timer);
  }, [title]);

  async function handleFormSubmit() {
    if (!title) {
      setError("Title is required");
      return;
    }

    if (duplicateWarning) {
      setDuplicateWarning(null);
    }

    setLoading(true);
    setError("");
    setDuplicateWarning(null);

    const resolvedCategory = category === "other" ? customCategory : category;

    const response = await fetch("/api/songs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        author,
        category: resolvedCategory,
        language,
        default_key: defaultKey || null,
        default_bpm: defaultBpm,
        default_time_signature: defaultTimeSignature || null,
        lyrics: lyrics || null,
        chords: chords || null,
      }),
    });

    if (!response.ok) {
      toast.error("Something went wrong. Try again.");
      setLoading(false);
      return;
    }

    toast.success("Song added successfully!");
    setSuccess(true);
    setTimeout(() => router.push("/songs"), 1500);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !(e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleFormSubmit();
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleFormSubmit();
    }
  }

  if (success) {
    return (
      <div className="flex-1 flex items-center justify-center -my-4">
        <div
          className="rounded-xl p-8 text-center"
          style={{
            backgroundColor: "var(--color-surface-card)",
            border: "1px solid var(--color-border)",
          }}
        >
          <p className="text-base font-medium" style={{ color: "var(--color-text)" }}>
            Song added successfully!
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-tertiary)" }}>
            Redirecting to song library...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col -my-4">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-4 w-fit px-1 py-1 -ml-1 rounded-lg transition-colors"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
        </svg>
        Back
      </button>
      <div className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-xl">
        <div
          className="rounded-xl p-6 flex flex-col gap-4"
          style={{
            backgroundColor: "var(--color-surface-card)",
            border: "1px solid var(--color-border)",
          }}
        >
          <h2
            className="text-xl font-bold"
            style={{ color: "var(--color-text)" }}
          >
            Add a song
          </h2>
        <div>
          <label
            className="text-sm font-medium"
            style={{ color: "var(--color-text)" }}
          >
            Title
          </label>
          <input
            ref={titleRef}
            type="text"
            name="new-song-title"
            autoComplete="off"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setDuplicateWarning(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Lihim"
            className="w-full rounded-lg px-3 py-2 text-sm mt-1.5 transition-colors"
            style={{
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text)",
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = "var(--color-accent)")
            }
            onBlur={(e) =>
              (e.target.style.borderColor = "var(--color-border)")
            }
          />
          {duplicateWarning && (
            <p className="text-xs mt-1" style={{ color: "var(--color-accent)" }}>
              A song named &ldquo;{duplicateWarning}&rdquo; already exists. Save anyway?
            </p>
          )}
        </div>
        <div>
          <label
            className="text-sm font-medium"
            style={{ color: "var(--color-text)" }}
          >
            Author/Band
          </label>
          <div className="relative mt-1.5">
            <input
              ref={authorRef}
              type="text"
              name="new-song-author"
              autoComplete="off"
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
              className="w-full rounded-lg px-3 py-2 text-sm transition-colors"
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
        </div>
        <div>
          <label
            className="text-sm font-medium"
            style={{ color: "var(--color-text)" }}
          >
            Category
          </label>
          <div className="flex gap-2 mt-1.5">
            {(["worship", "praise", "other"] as const).map((opt) => (
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
                {opt === "worship" ? "Worship" : opt === "praise" ? "Praise" : "Other"}
              </button>
            ))}
          </div>
        </div>
        {category === "other" && (
          <div>
            <label
              className="text-sm font-medium"
              style={{ color: "var(--color-text)" }}
            >
              Specify category
            </label>
            <input
              type="text"
              name="new-song-category"
              autoComplete="off"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="e.g. Hymn"
              className="w-full rounded-lg px-3 py-2 text-sm mt-1.5 transition-colors"
              style={{
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text)",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--color-accent)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--color-border)")
              }
            />
          </div>
        )}
        <div>
          <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
            Language
          </span>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {(["english", "filipino"] as const).map((lang) => (
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
                {lang === "english" ? "English" : "Filipino"}
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
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                handleFormSubmit();
              }
            }}
            placeholder="Enter song lyrics..."
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
          onBpmChange={(bpm) => setDefaultBpm(bpm)}
          onTimeSignatureChange={setDefaultTimeSignature}
        />
        {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => router.back()}
            className="rounded-lg px-3 py-1.5 text-sm font-medium"
            style={{
              border: "1px solid var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleFormSubmit}
            disabled={loading || !title}
            className="rounded-lg px-3 py-1.5 text-sm font-medium transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "var(--color-text-on-accent)",
            }}
          >
            {loading ? "Saving..." : "Save song"}
          </button>
        </div>
        </div>
      </div>
      </div>
    </div>
  );
}