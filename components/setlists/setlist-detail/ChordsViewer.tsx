"use client";

import { useEffect, useRef, useState } from "react";
import { SetlistSectionWithSong } from "@/lib/type";

const ZOOM_STEPS = [12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36];

type Props = {
  sections: SetlistSectionWithSong[];
  sectionType: string;
  activeSongId: string;
  onClose: () => void;
};

export default function ChordsViewer({
  sections,
  sectionType,
  activeSongId,
  onClose,
}: Props) {
  const activeRef = useRef<HTMLDivElement>(null);
  const filtered = sections.filter((s) => s.section_type === sectionType);
  const [zoomIndex, setZoomIndex] = useState(3);

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

  const fontSize = ZOOM_STEPS[zoomIndex];

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
            className="text-xl font-bold capitalize"
            style={{ color: "var(--color-text)" }}
          >
            {sectionType}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoomIndex(Math.max(0, zoomIndex - 1))}
              disabled={zoomIndex === 0}
              className="rounded-lg px-2.5 py-1 text-sm font-medium transition-all disabled:opacity-30 hover:opacity-80 min-h-[32px] flex items-center justify-center"
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
              className="text-xs font-medium tabular-nums min-w-[2.5rem] text-center"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {fontSize}px
            </span>
            <button
              onClick={() => setZoomIndex(Math.min(ZOOM_STEPS.length - 1, zoomIndex + 1))}
              disabled={zoomIndex === ZOOM_STEPS.length - 1}
              className="rounded-lg px-2.5 py-1 text-sm font-medium transition-all disabled:opacity-30 hover:opacity-80 min-h-[32px] flex items-center justify-center"
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
              </div>
              <pre
                className="w-full rounded-lg px-3 py-2 leading-relaxed whitespace-pre-wrap"
                style={{
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize,
                  fontWeight: "bold",
                  textShadow: "0 0 10px rgba(214, 79, 11, 0.6)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface-card)",
                  color: "var(--color-accent)",
                }}
              >
                {s.songs.chords || "No chords available."}
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
