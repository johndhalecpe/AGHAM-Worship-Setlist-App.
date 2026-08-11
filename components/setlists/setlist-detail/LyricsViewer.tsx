"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { SetlistSectionWithSong } from "@/lib/type";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { SONG_NAV_PREFETCH_CACHE, useSongNavigation } from "@/lib/hooks/use-song-navigation";
import SongNavBar from "./SongNavBar";

type Props = {
  sections: SetlistSectionWithSong[];
  sectionType: string;
  onClose: () => void;
};

const SECTION_LABELS: Record<string, string> = {
  worship: "Worship songs",
  praise: "Praise songs",
  tithes_offering: "Tithes and offering",
  special: "Special numbers",
};

const LYRICS_ZOOM_STEPS = [14, 15, 16, 17, 18];

export default function LyricsViewer({
  sections,
  sectionType,
  onClose,
}: Props) {
  const filtered = sections.filter((s) => s.section_type === sectionType);
  const [copiedSongId, setCopiedSongId] = useState<string | null>(null);
  const [expandedSongId, setExpandedSongId] = useState<string | null>(null);
  const [zoomIndex, setZoomIndex] = usePersistentState("lyrics-viewer:zoom-index", 0);
  const orderedSongs = useMemo(() => filtered.map((s) => s.songs), [filtered]);
  const songRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const {
    currentSong,
    currentIndex,
    prevSong,
    nextSong,
    hasPrevious,
    hasNext,
    goPrevious,
    goNext,
  } = useSongNavigation(orderedSongs, null);
  const currentSection = filtered[currentIndex] ?? null;

  useEffect(() => {
    for (const neighbor of [prevSong, nextSong]) {
      if (neighbor && !SONG_NAV_PREFETCH_CACHE.has(neighbor.id)) {
        fetch(`/api/songs/${neighbor.id}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data?.id) SONG_NAV_PREFETCH_CACHE.set(data.id, data);
          })
          .catch(() => undefined);
      }
    }
  }, [prevSong, nextSong]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const currentSectionId = currentSection?.id ?? null;

  useEffect(() => {
    const el = currentSectionId ? songRefs.current[currentSectionId] : null;
    if (el) {
      el.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }, [currentIndex, currentSectionId]);

  function getLyrics(s: SetlistSectionWithSong) {
    return s.songs.lyrics ?? "";
  }

  function toggleSong(songId: string) {
    setExpandedSongId((prev) => (prev === songId ? null : songId));
  }

  async function copyLyrics(lyrics: string, songId: string) {
    try {
      await navigator.clipboard.writeText(lyrics);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = lyrics;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedSongId(songId);
    setTimeout(() => setCopiedSongId(null), 2000);
    toast.success("Lyrics copied to clipboard");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center cursor-pointer"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", height: "100dvh" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-t-xl sm:rounded-xl p-5 sm:p-6 pb-[env(safe-area-inset-bottom,16px)] sm:pb-6 backdrop-blur-xl"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--color-text)" }}
          >
            {SECTION_LABELS[sectionType] || sectionType}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoomIndex(Math.max(0, zoomIndex - 1))}
              disabled={zoomIndex === 0}
              className="rounded-lg px-2.5 py-1 text-sm font-medium transition-all disabled:opacity-30 hover:opacity-80 min-h-[44px] sm:min-h-[32px] flex items-center justify-center"
              style={{
                backgroundColor: "var(--color-surface-muted)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
              }}
              aria-label="Zoom out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M2 10a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Z" />
              </svg>
            </button>
            <span
              className="text-xs font-medium tabular-nums min-w-[3rem] text-center"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Zoom
            </span>
            <button
              onClick={() => setZoomIndex(Math.min(LYRICS_ZOOM_STEPS.length - 1, zoomIndex + 1))}
              disabled={zoomIndex === LYRICS_ZOOM_STEPS.length - 1}
              className="rounded-lg px-2.5 py-1 text-sm font-medium transition-all disabled:opacity-30 hover:opacity-80 min-h-[44px] sm:min-h-[32px] flex items-center justify-center"
              style={{
                backgroundColor: "var(--color-surface-muted)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
              }}
              aria-label="Zoom in"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M10.75 3.25a.75.75 0 0 0-1.5 0v6h-6a.75.75 0 0 0 0 1.5h6v6a.75.75 0 0 0 1.5 0v-6h6a.75.75 0 0 0 0-1.5h-6v-6Z" />
              </svg>
            </button>
          </div>
        </div>
        <p className="text-xs mb-1 mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5">
            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
          </svg>
          Tap a song title to view its lyrics
        </p>
        <p className="text-xs italic mb-6" style={{ color: "var(--color-text-tertiary)" }}>
          Tap outside to close
        </p>

        <div className="flex flex-col">
          {filtered.map((s, i) => (
            <div key={s.id} ref={(el) => { songRefs.current[s.id] = el; }}>
              {i > 0 && (
                <hr
                  className="my-6"
                  style={{ borderColor: "var(--color-border)" }}
                />
              )}
              <div className="rounded-lg p-4">
                <button
                  onClick={() => toggleSong(s.id)}
                  aria-expanded={expandedSongId === s.id}
                  className="w-full flex items-center justify-between gap-2 text-left mb-1 min-h-[44px] sm:min-h-[28px]"
                >
                  <h3
                    className="text-base font-semibold break-words"
                    style={{ color: "var(--color-text)" }}
                  >
                    {s.songs.title}
                  </h3>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4 shrink-0 transition-transform duration-200"
                    style={{
                      color: "var(--color-text-tertiary)",
                      transform: expandedSongId === s.id ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                    aria-hidden="true"
                  >
                    <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {s.songs.author && (
                      <p
                        className="text-xs truncate"
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        {s.songs.author}
                      </p>
                    )}
                    <span
                      className="text-xs font-mono font-semibold rounded px-1.5 min-h-[22px] flex items-center shrink-0"
                      style={{
                        backgroundColor: "var(--color-badge-key)",
                        color: "var(--color-badge-key-text)",
                      }}
                    >
                      Key: {s.song_key ?? s.songs.default_key ?? "G"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => copyLyrics(getLyrics(s), s.id)}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all hover:-translate-y-0.5 min-h-[32px] flex items-center gap-1.5"
                      style={{
                        backgroundColor: copiedSongId === s.id ? "var(--color-success)" : "var(--color-accent)",
                        color: "var(--color-text-on-accent)",
                      }}
                      aria-label="Copy lyrics"
                    >
                      {copiedSongId === s.id ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                            <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-1v-3.379a3 3 0 0 0-.879-2.121L10.5 5.379A3 3 0 0 0 8.379 4.5H7v-1Z" />
                            <path d="M4.5 6A1.5 1.5 0 0 0 3 7.5v9A1.5 1.5 0 0 0 4.5 18h7a1.5 1.5 0 0 0 1.5-1.5v-5.879a1.5 1.5 0 0 0-.44-1.06L9.44 6.439A1.5 1.5 0 0 0 8.378 6H4.5Z" />
                          </svg>
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
                {s.notes && (
                  <p className="text-xs mb-2 italic leading-relaxed" style={{ color: "var(--color-accent)" }}>
                    &ldquo;{s.notes}&rdquo;
                  </p>
                )}
                {expandedSongId === s.id && (
                  <pre
                    className="w-full rounded-lg px-3 py-2 leading-relaxed font-sans whitespace-pre-wrap animate-fade-in"
                    style={{
                      fontSize: LYRICS_ZOOM_STEPS[zoomIndex],
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--color-surface-card)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {getLyrics(s) || "No lyrics available."}
                  </pre>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p
              className="text-sm"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              No songs in this section.
            </p>
          )}
          {filtered.length > 1 && (
            <SongNavBar
              currentSong={currentSong}
              prevSong={prevSong}
              nextSong={nextSong}
              hasPrevious={hasPrevious}
              hasNext={hasNext}
              currentIndex={currentIndex}
              totalCount={filtered.length}
              onPrevious={goPrevious}
              onNext={goNext}
            />
          )}
        </div>
      </div>
    </div>
  );
}
