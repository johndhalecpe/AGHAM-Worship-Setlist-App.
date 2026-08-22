"use client";

import { useEffect, useRef, useState } from "react";
import { Song } from "@/lib/type";
import { supabase } from "@/lib/supabase";
import { nashvilleToLetter, letterToNashville, isLetterChordFormat, transposeLetterChords, transposeKey } from "@/lib/chord-conversion";
import Portal from "@/components/shared/Portal";

type Mode = "chords" | "lyrics";

const MAX_ROWS = 6;

export default function QuickSongLookup() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("lyrics");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [chordDisplayMode, setChordDisplayMode] = useState<"nashville" | "letter">("nashville");
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [modalSong, setModalSong] = useState<Song | null>(null);
  const [modalTransposeOffset, setModalTransposeOffset] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (profile?.role === "musician") {
        setMode("chords");
      }
    })();
  }, []);

  function resetSelection() {
    setCopied(false);
    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = null;
    }
  }

  function openModal(song: Song) {
    setModalSong(song);
    setModalTransposeOffset(0);
    setCopied(false);
    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = null;
    }
  }

  function closeModal() {
    setModalSong(null);
    setCopied(false);
    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = null;
    }
  }

  function handleCopy(fieldText: string) {
    navigator.clipboard.writeText(fieldText);
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  }

  function handleChange(value: string) {
    resetSelection();
    setQuery(value);
    if (value.trim() === "") {
      setResults([]);
      setLoading(false);
      setError(false);
      setOpen(false);
      return;
    }
    setLoading(true);
    setError(false);
    setOpen(true);
  }

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === "") return;

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/songs?search=${encodeURIComponent(trimmed)}&mode=${mode}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setResults(data);
        setOpen(true);
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        setError(true);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, mode]);

  useEffect(() => {
    if (!open) return;

    function handleMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <p
        className="text-xs font-semibold uppercase tracking-wider mb-1.5"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        Quick Search
      </p>
      <div
        className="rounded-xl flex items-center gap-2 px-3 sm:px-4 transition-all"
        style={{
          backgroundColor: "var(--color-surface-card)",
          border: "1px solid var(--color-border)",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-5 h-5 shrink-0"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
            clipRule="evenodd"
          />
        </svg>

        <div
          className="flex rounded-lg p-0.5 shrink-0"
          style={{ backgroundColor: "var(--color-surface-elevated)" }}
        >
          {(["chords", "lyrics"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                resetSelection();
                setMode(m);
                setModalTransposeOffset(0);
                if (query.trim() !== "") {
                  setLoading(true);
                  setError(false);
                  setOpen(true);
                }
              }}
              className="px-2.5 py-1 text-xs font-medium rounded-md transition-colors min-h-[28px]"
              style={{
                backgroundColor: m === mode ? "var(--color-accent)" : "transparent",
                color: m === mode ? "var(--color-text-on-accent)" : "var(--color-text-secondary)",
              }}
            >
              {m === "chords" ? "Chords" : "Lyrics"}
            </button>
          ))}
        </div>

        <input
          ref={inputRef}
          type="text"
          name="quick-lookup-search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoCapitalize="off"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={
            mode === "chords" ? "Quick Search Chords" : "Quick Search Lyrics"
          }
          className="w-full py-2.5 sm:py-3 text-[13px] bg-transparent outline-none min-h-[44px]"
          style={{ color: "var(--color-text)" }}
          onFocus={(e) => {
            const border = e.currentTarget.closest("div");
            if (border) border.style.borderColor = "var(--color-accent)";
          }}
          onBlur={(e) => {
            const border = e.currentTarget.closest("div");
            if (border) border.style.borderColor = "var(--color-border)";
          }}
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              handleChange("");
              inputRef.current?.focus();
            }}
            className="p-1.5 rounded transition-colors hover:opacity-80 min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0"
            style={{ color: "var(--color-text-tertiary)" }}
            aria-label="Clear search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        )}
      </div>

      {open && query.trim() !== "" && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-40 rounded-xl"
          style={{
            backgroundColor: "var(--color-surface-card)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="max-h-[60dvh] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Searching...
              </div>
            ) : error ? (
              <div className="px-4 py-3 text-sm" style={{ color: "var(--color-danger)" }}>
                Search failed
              </div>
            ) : results.length === 0 ? (
              <div className="px-4 py-3 text-sm" style={{ color: "var(--color-text-tertiary)" }}>
                No songs found
              </div>
            ) : (
              results.slice(0, MAX_ROWS).map((song) => {
                const fieldText = mode === "chords" ? song.chords : song.lyrics;
                const isEmpty = !fieldText || fieldText.trim() === "";
                const baseKey = song.default_key || "G";

                return (
                  <div
                    key={song.id}
                    className="border-b last:border-b-0"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <div
                      className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors cursor-pointer"
                      onClick={() => openModal(song)}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.backgroundColor =
                          "var(--color-surface-elevated)")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")
                      }
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-medium truncate block">{song.title}</span>
                        <span
                          className="text-xs truncate block"
                          style={{ color: "var(--color-text-tertiary)" }}
                        >
                          {song.author}
                        </span>
                      </div>
                      <span
                        className="text-xs font-mono font-semibold rounded px-1.5 shrink-0 min-w-[3rem] text-center"
                        style={{
                          backgroundColor: "var(--color-badge-key)",
                          color: "var(--color-badge-key-text)",
                        }}
                      >
                        {baseKey}
                      </span>
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4 shrink-0"
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {modalSong && (
        <Modal
          song={modalSong}
          mode={mode}
          chordDisplayMode={chordDisplayMode}
          setChordDisplayMode={setChordDisplayMode}
          transposeOffset={modalTransposeOffset}
          setTransposeOffset={setModalTransposeOffset}
          copied={copied}
          onCopy={handleCopy}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

function Modal({
  song,
  mode,
  chordDisplayMode,
  setChordDisplayMode,
  transposeOffset,
  setTransposeOffset,
  copied,
  onCopy,
  onClose,
}: {
  song: Song;
  mode: Mode;
  chordDisplayMode: "nashville" | "letter";
  setChordDisplayMode: (v: "nashville" | "letter") => void;
  transposeOffset: number;
  setTransposeOffset: (v: number | ((o: number) => number)) => void;
  copied: boolean;
  onCopy: (text: string) => void;
  onClose: () => void;
}) {
  const fieldText = mode === "chords" ? song.chords : song.lyrics;
  const isEmpty = !fieldText || fieldText.trim() === "";
  const baseKey = song.default_key || "G";
  const displayKey = transposeOffset !== 0 ? transposeKey(baseKey, transposeOffset) : baseKey;

  let displayChords = fieldText ?? "";
  let conversionFailed = false;

  if (mode === "chords" && !isEmpty && fieldText) {
    const storedIsLetter = isLetterChordFormat(fieldText);
    if (chordDisplayMode === "nashville") {
      if (storedIsLetter) {
        displayChords = fieldText;
      }
    } else {
      if (storedIsLetter) {
        if (transposeOffset !== 0) {
          displayChords = transposeLetterChords(fieldText, transposeOffset);
        }
      } else {
        const result = nashvilleToLetter(fieldText, displayKey);
        if (result.success) {
          displayChords = result.output;
        } else {
          conversionFailed = true;
          console.warn(`[QuickSongLookup] nashvilleToLetter failed for "${song.title}" (key: ${displayKey}):`, result.errors);
        }
      }
    }
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[400] flex items-center justify-center p-4 sm:p-6"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[85dvh]"
          style={{
            backgroundColor: "var(--color-surface-card)",
            border: "1px solid var(--color-border)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex-1 min-w-0 mr-3">
              <h2 className="text-base font-bold truncate" style={{ color: "var(--color-text)" }}>
                {song.title}
              </h2>
              <p className="text-xs truncate" style={{ color: "var(--color-text-tertiary)" }}>
                {song.author}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors hover:opacity-80 min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>

          <div className="px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              {mode === "chords" && !isEmpty && (
                <div className="flex rounded overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
                  <button
                    type="button"
                    onClick={() => setChordDisplayMode("nashville")}
                    className="px-2 py-0.5 text-[10px] font-semibold transition-colors min-h-[24px]"
                    style={{
                      backgroundColor: chordDisplayMode === "nashville" ? "var(--color-accent)" : "var(--color-surface-muted)",
                      color: chordDisplayMode === "nashville" ? "#fff" : "var(--color-text-secondary)",
                    }}
                  >
                    Nashville
                  </button>
                  <button
                    type="button"
                    onClick={() => setChordDisplayMode("letter")}
                    className="px-2 py-0.5 text-[10px] font-semibold transition-colors min-h-[24px]"
                    style={{
                      backgroundColor: chordDisplayMode === "letter" ? "var(--color-accent)" : "var(--color-surface-muted)",
                      color: chordDisplayMode === "letter" ? "#fff" : "var(--color-text-secondary)",
                    }}
                  >
                    Letter
                  </button>
                </div>
              )}
              {conversionFailed && (
                <span className="text-[10px] font-medium" style={{ color: "var(--color-danger)" }}>
                  Conversion failed
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTransposeOffset((o: number) => o - 1)}
                className="px-2 py-0.5 rounded text-[11px] font-semibold transition-colors min-h-[28px] flex items-center justify-center"
                style={{
                  backgroundColor: "var(--color-surface-muted)",
                  color: "var(--color-text-secondary)",
                  visibility: mode === "chords" ? "visible" : "hidden",
                  pointerEvents: mode === "chords" ? "auto" : "none",
                }}
              >
                &minus;1
              </button>
              <span
                className="text-xs font-mono font-semibold rounded px-2 min-w-[3.5rem] text-center"
                style={{
                  backgroundColor: "var(--color-badge-key)",
                  color: transposeOffset !== 0 ? "var(--color-accent)" : "var(--color-badge-key-text)",
                  visibility: mode === "chords" ? "visible" : "hidden",
                }}
              >
                {displayKey}
              </span>
              <button
                type="button"
                onClick={() => setTransposeOffset((o: number) => o + 1)}
                className="px-2 py-0.5 rounded text-[11px] font-semibold transition-colors min-h-[28px] flex items-center justify-center"
                style={{
                  backgroundColor: "var(--color-surface-muted)",
                  color: "var(--color-text-secondary)",
                  visibility: mode === "chords" ? "visible" : "hidden",
                  pointerEvents: mode === "chords" ? "auto" : "none",
                }}
              >
                +1
              </button>
            </div>

            <button
              type="button"
              onClick={() => onCopy(mode === "chords" ? displayChords : (fieldText ?? ""))}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5"
              style={{
                backgroundColor: copied ? "var(--color-success)" : "var(--color-accent)",
                color: "var(--color-text-on-accent)",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3.5 h-3.5"
              >
                <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-1v-3.379a3 3 0 0 0-.879-2.121L10.5 5.379A3 3 0 0 0 8.379 4.5H7v-1Z" />
                <path d="M4.5 6A1.5 1.5 0 0 0 3 7.5v9A1.5 1.5 0 0 0 4.5 18h7a1.5 1.5 0 0 0 1.5-1.5v-5.879a1.5 1.5 0 0 0-.44-1.06L9.44 6.439A1.5 1.5 0 0 0 8.378 6H4.5Z" />
              </svg>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-5">
            <div
              style={
                isEmpty
                  ? { color: "var(--color-text-tertiary)" }
                  : mode === "chords"
                    ? {
                        whiteSpace: "pre-wrap",
                        fontFamily: "'Courier New', Courier, monospace",
                        fontWeight: "bold",
                        color: "var(--color-chord-text)",
                        fontSize: 14,
                        lineHeight: 1.6,
                      }
                    : { whiteSpace: "pre-wrap", color: "var(--color-text)", lineHeight: 1.8 }
              }
            >
              {isEmpty
                ? mode === "chords"
                  ? "No chords available."
                  : "No lyrics available."
                : mode === "chords"
                  ? displayChords
                  : fieldText}
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}