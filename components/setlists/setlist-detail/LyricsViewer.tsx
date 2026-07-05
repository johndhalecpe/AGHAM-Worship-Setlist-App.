"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SetlistSectionWithSong } from "@/lib/type";
import { SECTION_TYPE_LABELS } from "@/lib/sectionLabels";

type Props = {
  sections: SetlistSectionWithSong[];
  sectionType: string;
  activeSongId: string;
  onClose: () => void;
};

export default function LyricsViewer({
  sections,
  sectionType,
  activeSongId,
  onClose,
}: Props) {
  const activeRef = useRef<HTMLDivElement>(null);
  const filtered = sections.filter((section) => section.section_type === sectionType);
  const [copiedSongId, setCopiedSongId] = useState<string | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function getLyrics(section: SetlistSectionWithSong) {
    return section.songs.lyrics ?? "";
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-xl sm:rounded-xl p-5 sm:p-6 backdrop-blur-xl"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-lg font-semibold mb-6"
          style={{ color: "var(--color-text)" }}
        >
          {SECTION_TYPE_LABELS[sectionType] || sectionType}
        </h2>

        <div className="flex flex-col">
          {filtered.map((section, i) => (
            <div key={section.id}>
              {i > 0 && (
                <hr
                  className="my-6"
                  style={{ borderColor: "var(--color-border)" }}
                />
              )}
              <div
                ref={section.id === activeSongId ? activeRef : undefined}
                className="rounded-lg p-4 transition-colors"
                style={{
                  backgroundColor:
                    section.id === activeSongId
                      ? "var(--color-surface-muted)"
                      : "transparent",
                  border:
                    section.id === activeSongId
                      ? "1px solid var(--color-border)"
                      : "1px solid transparent",
                }}
              >
                <div className="flex items-center justify-between mb-2 gap-2">
                  <div className="min-w-0 flex-1 flex items-center gap-2">
                    <h3
                      className="text-base font-semibold truncate"
                      style={{ color: "var(--color-text)" }}
                    >
                      {section.songs.title}
                    </h3>
                    {section.songs.author && (
                      <p
                        className="text-xs truncate shrink-0"
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        {section.songs.author}
                      </p>
                    )}
                    <span
                      className="text-xs font-mono font-semibold rounded px-1.5 min-h-[22px] flex items-center shrink-0"
                      style={{
                        backgroundColor: "var(--color-badge-key)",
                        color: "var(--color-badge-key-text)",
                      }}
                    >
                      Key: {section.song_key ?? section.songs.default_key ?? "G"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => copyLyrics(getLyrics(section), section.id)}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all hover:-translate-y-0.5 min-h-[32px] flex items-center gap-1.5"
                      style={{
                        backgroundColor: copiedSongId === section.id ? "var(--color-success)" : "var(--color-accent)",
                        color: "var(--color-text-on-accent)",
                      }}
                      aria-label="Copy lyrics"
                    >
                      {copiedSongId === section.id ? (
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
                {section.notes && (
                  <p className="text-xs mb-2 italic leading-relaxed" style={{ color: "var(--color-accent)" }}>
                    &ldquo;{section.notes}&rdquo;
                  </p>
                )}
                <pre
                    className="w-full rounded-lg px-3 py-2 text-sm leading-relaxed font-sans whitespace-pre-wrap"
                    style={{
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--color-surface-card)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {getLyrics(section) || "No lyrics available."}
                  </pre>
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
        </div>
      </div>
    </div>
  );
}
