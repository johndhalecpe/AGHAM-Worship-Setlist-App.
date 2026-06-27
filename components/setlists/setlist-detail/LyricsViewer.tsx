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
        <div className="flex items-center justify-between mb-6">
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

        <div className="flex flex-col gap-6">
          {filtered.map((s) => (
            <div
              key={s.id}
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
              <h3
                className="text-base font-semibold mb-1"
                style={{ color: "var(--color-text)" }}
              >
                {s.songs.title}
              </h3>
              {s.songs.author && (
                <p
                  className="text-xs mb-3"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  {s.songs.author}
                </p>
              )}
              {s.songs.lyrics ? (
                <pre
                  className="text-sm leading-relaxed whitespace-pre-wrap font-sans"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {s.songs.lyrics}
                </pre>
              ) : (
                <p
                  className="text-sm italic"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  No lyrics available for this song.
                </p>
              )}
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
