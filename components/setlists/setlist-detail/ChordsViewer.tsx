"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Setlist, SetlistSectionWithSong } from "@/lib/type";

const ZOOM_STEPS = [12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36];

type Props = {
  setlist: Setlist;
  sections: SetlistSectionWithSong[];
  sectionType: string;
  activeSongId: string;
  isPast?: boolean;
  onClose: () => void;
  onSectionsChange: (sections: SetlistSectionWithSong[] | ((prev: SetlistSectionWithSong[]) => SetlistSectionWithSong[])) => void;
};

export default function ChordsViewer({
  setlist,
  sections,
  sectionType,
  activeSongId,
  isPast = false,
  onClose,
  onSectionsChange,
}: Props) {
  const activeRef = useRef<HTMLDivElement>(null);
  const filtered = sections.filter((s) => s.section_type === sectionType);
  const [zoomIndex, setZoomIndex] = useState(3);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const initialNotesRef = useRef<Record<string, string>>({});
  const [showDrummer, setShowDrummer] = useState(false);

  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const s of filtered) {
      if (s.chord_notes) {
        for (const [key, val] of Object.entries(s.chord_notes)) {
          if (val) initial[`${s.id}-${key}`] = val;
        }
      }
    }
    setNotes(initial);
    initialNotesRef.current = initial;
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const handleClose = useCallback(async () => {
    if (isPast) {
      toast.error("Can't edit past lineups");
      onClose();
      return;
    }

    const hasChanges = Object.keys(notes).length !== Object.keys(initialNotesRef.current).length ||
      Object.entries(notes).some(([k, v]) => initialNotesRef.current[k] !== v);
    if (!hasChanges) {
      onClose();
      return;
    }

    const items = filtered.map((s) => {
      const chordNotes: Record<string, string> = {};
      for (const suffix of ["intro", "outro", "transition", "drummer_notes"]) {
        const val = notes[`${s.id}-${suffix}`];
        if (val) chordNotes[suffix] = val;
      }
      return {
        id: s.id,
        chord_notes: Object.keys(chordNotes).length > 0 ? chordNotes : null,
      };
    });

    const res = await fetch(`/api/setlists/${setlist.id}/sections`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    if (!res.ok) {
      toast.error("Failed to save notes");
      return;
    }

    toast.success(showDrummer ? "Drummer notes saved" : "Chord notes saved");
    onSectionsChange((prev) =>
      prev.map((sec) => {
        const item = items.find((i) => i.id === sec.id);
        return item ? { ...sec, chord_notes: item.chord_notes } : sec;
      })
    );

    onClose();
  }, [filtered, notes, setlist.id, onSectionsChange, onClose]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  const fontSize = ZOOM_STEPS[zoomIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-t-xl sm:rounded-xl p-5 sm:p-6 backdrop-blur-xl"
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
              onClick={() => setShowDrummer(!showDrummer)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors shrink-0"
              style={{
                backgroundColor: showDrummer ? "#D84F0B" : "var(--color-surface-card)",
                color: showDrummer ? "#fff" : "var(--color-text-secondary)",
                border: showDrummer ? "none" : "1px solid var(--color-border)",
              }}
            >
              {showDrummer ? "Chord notes" : "Drummer notes"}
            </button>
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

        {showDrummer ? (
          <div className="flex flex-col gap-3">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="rounded-lg p-4"
                style={{
                  backgroundColor: "var(--color-surface-card)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <h3 className="text-base font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                  {s.songs.title}
                </h3>
                <textarea
                  ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }}
                  value={notes[`${s.id}-drummer_notes`] ?? ""}
                  onChange={(e) => {
                    setNotes((prev) => ({ ...prev, [`${s.id}-drummer_notes`]: e.target.value }));
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }}
                  readOnly={isPast}
                  onFocus={(e) => { if (isPast) { e.target.blur(); toast.error("Can't edit past lineups"); } }}
                  placeholder="Drummer notes for this song..."
                  className="w-full rounded-lg px-3 py-2 leading-relaxed outline-none resize-none overflow-hidden"
                  style={{
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize,
                    fontWeight: "bold",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-accent)",
                  }}
                />
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
                No songs in this section.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col">
            {filtered.map((s, i) => (
              <div key={s.id}>
                {i === 0 && (
                  <input
                    value={notes[`${s.id}-intro`] ?? ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [`${s.id}-intro`]: e.target.value }))}
                    readOnly={isPast}
                    onFocus={(e) => { if (isPast) { e.target.blur(); toast.error("Can't edit past lineups"); } }}
                    placeholder="add intro"
                    className="w-full rounded-lg px-3 py-1.5 mb-4 leading-relaxed outline-none"
                    style={{
                      fontFamily: "'Courier New', Courier, monospace",
                      fontSize,
                      fontWeight: "bold",
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--color-surface-card)",
                      color: "var(--color-accent)",
                    }}
                  />
                )}
                <hr
                  className="mb-4"
                  style={{ borderColor: "var(--color-border)" }}
                />
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
                <input
                  value={notes[`${s.id}-outro`] ?? ""}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [`${s.id}-outro`]: e.target.value }))}
                  readOnly={isPast}
                  onFocus={(e) => { if (isPast) { e.target.blur(); toast.error("Can't edit past lineups"); } }}
                  placeholder="add outro"
                  className="w-full rounded-lg px-3 py-1.5 mt-4 leading-relaxed outline-none"
                  style={{
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize,
                    fontWeight: "bold",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-surface-card)",
                    color: "var(--color-accent)",
                  }}
                />
                {i < filtered.length - 1 && (
                  <input
                    value={notes[`${s.id}-transition`] ?? ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [`${s.id}-transition`]: e.target.value }))}
                    readOnly={isPast}
                    onFocus={(e) => { if (isPast) { e.target.blur(); toast.error("Can't edit past lineups"); } }}
                    placeholder="add transition"
                    className="w-full rounded-lg px-3 py-1.5 mt-2 mb-4 leading-relaxed outline-none"
                    style={{
                      fontFamily: "'Courier New', Courier, monospace",
                      fontSize,
                      fontWeight: "bold",
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--color-surface-card)",
                      color: "var(--color-accent)",
                    }}
                  />
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
        )}
      </div>
    </div>
  );
}
