"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Setlist, SetlistSectionWithSong } from "@/lib/type";
import { SECTION_TYPE_LABELS } from "@/lib/sectionLabels";

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
  const filtered = sections.filter((section) => section.section_type === sectionType);
  const [zoomIndex, setZoomIndex] = useState(3);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const initialNotesRef = useRef<Record<string, string>>({});
  const [showDrummer, setShowDrummer] = useState(false);

  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const section of filtered) {
      if (section.chord_notes) {
        for (const [key, val] of Object.entries(section.chord_notes)) {
          if (val) initial[`${section.id}-${key}`] = val;
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

  const handleSaveAndClose = useCallback(async () => {
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

    const items = filtered.map((section) => {
      const chordNotes: Record<string, string> = {};
      for (const suffix of ["intro", "outro", "transition", "drummer_notes"]) {
        const val = notes[`${section.id}-${suffix}`];
        if (val) chordNotes[suffix] = val;
      }
      return {
        id: section.id,
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
      if (e.key === "Escape") handleSaveAndClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSaveAndClose]);

  const fontSize = ZOOM_STEPS[zoomIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={handleSaveAndClose}
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
            className="text-xl font-bold"
            style={{ color: "var(--color-text)" }}
          >
            {SECTION_TYPE_LABELS[sectionType] || sectionType}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDrummer(!showDrummer)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors shrink-0 flex items-center gap-1"
              style={{
                backgroundColor: showDrummer ? "#D84F0B" : "var(--color-surface-card)",
                color: showDrummer ? "#fff" : "var(--color-text-secondary)",
                border: showDrummer ? "none" : "1px solid var(--color-border)",
              }}
            >
              {showDrummer ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M9.401 3.003c1.155-2.256 3.45-2.412 4.51-2.438.22-.006.396.143.399.362.008 1.07.2 2.915.787 3.976.637 1.16 1.674 1.754 2.222 1.998.15.067.248.216.246.377a15.118 15.118 0 0 1-.252 3.052c-1.39 6.635-6.87 8.12-10.404 8.12-2.273 0-6.392-.855-6.392-4.035 0-1.523.734-2.964 2.178-3.491 1.385-.504 2.292.22 2.73.802.583.776.646 1.787.646 2.381v.01a3.598 3.598 0 0 0 3.02 3.452c1.608.213 3.28-.034 4.607-1.11 1.592-1.29 2.226-3.529 2.226-5.756 0-1.09-.163-2.204-.506-3.238.197-.067.325-.24.375-.43.108-.415.02-1.003-.188-1.558a4.587 4.587 0 0 0-.582-1.102l-.01-.013c-.145-.194-.329-.424-.574-.618-.199-.158-.476-.31-.799-.411a3.616 3.616 0 0 0-.675-.137c-.327-.039-.83-.055-1.36-.011-1.52.126-2.755.64-2.755.64z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M5.5 2.5a.5.5 0 0 1 .5.5v5.5l4-3v9l-4-3V17a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5v-14a.5.5 0 0 1 .5-.5h2.5Z" />
                  <path d="M14.5 2.5a.5.5 0 0 1 .5.5v5.5l4-3v9l-4-3V17a.5.5 0 0 1-.5.5H12a.5.5 0 0 1-.5-.5v-14a.5.5 0 0 1 .5-.5h2.5Z" />
                </svg>
              )}
              {showDrummer ? "Chords" : "Drums"}
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
            {filtered.map((section) => (
              <div
                key={section.id}
                className="rounded-lg p-4"
                style={{
                  backgroundColor: "var(--color-surface-card)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="text-base font-semibold truncate" style={{ color: "var(--color-text)" }}>
                      {section.songs.title}
                    </h3>
                    {section.songs.author && (
                      <p className="text-xs shrink-0" style={{ color: "var(--color-text-tertiary)" }}>
                        {section.songs.author}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className="text-xs font-mono font-semibold rounded px-1.5 min-h-[22px] flex items-center"
                      style={{
                        backgroundColor: "var(--color-badge-key)",
                        color: "var(--color-badge-key-text)",
                      }}
                    >
                      Key: {section.song_key ?? section.songs.default_key ?? "G"}
                    </span>
                    <span
                      className="text-xs font-mono rounded px-1.5 min-h-[22px] flex items-center"
                      style={{
                        backgroundColor: "var(--color-badge-bpm)",
                        color: "var(--color-badge-bpm-text)",
                      }}
                    >
                      Bpm: {section.songs.default_bpm ?? 120}
                    </span>
                    <span
                      className="text-xs font-mono rounded px-1.5 min-h-[22px] flex items-center"
                      style={{
                        backgroundColor: "var(--color-badge-ts)",
                        color: "var(--color-badge-ts-text)",
                      }}
                    >
                      {section.songs.default_time_signature ?? "4/4"}
                    </span>
                  </div>
                </div>
                {section.notes && (
                  <p className="text-xs mb-2 italic leading-relaxed" style={{ color: "var(--color-accent)" }}>
                    &ldquo;{section.notes}&rdquo;
                  </p>
                )}
                <textarea
                  name={`${section.id}-drummer_notes`}
                  autoComplete="off"
                  ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }}
                  value={notes[`${section.id}-drummer_notes`] ?? ""}
                  onChange={(e) => {
                    setNotes((prev) => ({ ...prev, [`${section.id}-drummer_notes`]: e.target.value }));
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
            {filtered.map((section, i) => (
              <div key={section.id}>
                {i === 0 && (
                  <input
                    name={`${section.id}-intro`}
                    autoComplete="off"
                    value={notes[`${section.id}-intro`] ?? ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [`${section.id}-intro`]: e.target.value }))}
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
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3
                      className="text-base font-semibold truncate"
                      style={{ color: "var(--color-text)" }}
                    >
                      {section.songs.title}
                    </h3>
                    {section.songs.author && (
                      <p
                        className="text-xs shrink-0"
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        {section.songs.author}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className="text-xs font-mono font-semibold rounded px-1.5 min-h-[22px] flex items-center"
                      style={{
                        backgroundColor: "var(--color-badge-key)",
                        color: "var(--color-badge-key-text)",
                      }}
                    >
                      Key: {section.song_key ?? section.songs.default_key ?? "G"}
                    </span>
                    <span
                      className="text-xs font-mono rounded px-1.5 min-h-[22px] flex items-center"
                      style={{
                        backgroundColor: "var(--color-badge-bpm)",
                        color: "var(--color-badge-bpm-text)",
                      }}
                    >
                      Bpm: {section.songs.default_bpm ?? 120}
                    </span>
                    <span
                      className="text-xs font-mono rounded px-1.5 min-h-[22px] flex items-center"
                      style={{
                        backgroundColor: "var(--color-badge-ts)",
                        color: "var(--color-badge-ts-text)",
                      }}
                    >
                      {section.songs.default_time_signature ?? "4/4"}
                    </span>
                  </div>
                </div>
                {section.notes && (
                  <p className="text-xs mb-2 italic leading-relaxed" style={{ color: "var(--color-accent)" }}>
                    &ldquo;{section.notes}&rdquo;
                  </p>
                )}
                <pre
                  className="w-full rounded-lg px-3 py-2 leading-relaxed whitespace-pre-wrap"
                  style={{
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize,
                    fontWeight: "bold",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-surface-card)",
                    color: "var(--color-accent)",
                  }}
                >
                  {section.songs.chords || "No chords available."}
                </pre>
                </div>
                <input
                  name={`${section.id}-outro`}
                  autoComplete="off"
                  value={notes[`${section.id}-outro`] ?? ""}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [`${section.id}-outro`]: e.target.value }))}
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
                    name={`${section.id}-transition`}
                    autoComplete="off"
                    value={notes[`${section.id}-transition`] ?? ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [`${section.id}-transition`]: e.target.value }))}
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
