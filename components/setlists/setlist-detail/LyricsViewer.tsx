"use client";

import { useEffect, useRef } from "react";
import { SetlistSectionWithSong } from "@/lib/type";

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
  const filtered = sections.filter((s) => s.section_type === sectionType);

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

  function getEffectiveLyrics(s: SetlistSectionWithSong) {
    return s.override_lyrics ?? s.songs.lyrics ?? "";
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
        <div className="sticky top-0 z-10 flex items-center justify-between mb-6" style={{ backgroundColor: "var(--color-surface)" }}>
          <h2
            className="text-lg font-semibold capitalize"
            style={{ color: "var(--color-text)" }}
          >
            {sectionType}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:opacity-80 min-h-[44px] min-w-[44px] flex items-center justify-center"
            style={{
              backgroundColor: "var(--color-surface-muted)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
            aria-label="Close lyrics viewer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col">
          {filtered.map((s, i) => (
            <div key={s.id}>
              {i > 0 && (
                <hr
                  className="my-6"
                  style={{ borderColor: "var(--color-border)" }}
                />
              )}
              <div
                ref={s.id === activeSongId ? activeRef : undefined}
                className="rounded-lg p-4 transition-colors"
                style={{
                  backgroundColor:
                    s.id === activeSongId
                      ? "var(--color-surface-muted)"
                      : "transparent",
                  border:
                    s.id === activeSongId
                      ? "1px solid var(--color-border)"
                      : "1px solid transparent",
                }}
              >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3
                    className="text-base font-semibold"
                    style={{ color: "var(--color-text)" }}
                  >
                    {s.songs.title}
                  </h3>
                  {s.songs.author && (
                    <p
                      className="text-xs"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      {s.songs.author}
                    </p>
                  )}
                </div>
                {s.override_lyrics && (
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: "var(--color-accent)",
                      color: "var(--color-text-on-accent)",
                    }}
                  >
                    Edited
                  </span>
                )}
              </div>
              <pre
                className="w-full rounded-lg px-3 py-2 text-sm leading-relaxed font-sans whitespace-pre-wrap"
                style={{
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface-card)",
                  color: "var(--color-text-secondary)",
                }}
              >
                {getEffectiveLyrics(s) || "No lyrics available."}
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
