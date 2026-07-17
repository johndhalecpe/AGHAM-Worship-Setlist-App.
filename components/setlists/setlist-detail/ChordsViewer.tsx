"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Setlist, SetlistSectionWithSong } from "@/lib/type";
import { useIsGuest } from "@/lib/hooks/useIsGuest";
import KeyPicker from "@/components/ui/KeyPicker";

const AUTO_SAVE_DELAY = 2000;

const ZOOM_STEPS = [12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36];

const SECTION_LABELS: Record<string, string> = {
  worship: "Worship songs",
  praise: "Praise songs",
  tithes_offering: "Tithes and offering",
  special: "Special numbers",
};

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
  const isGuest = useIsGuest();
  const activeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const filtered = sections.filter((s) => s.section_type === sectionType);
  const [zoomIndex, setZoomIndex] = useState(3);
  const [chordEdits, setChordEdits] = useState<Record<string, string>>({});
  const chordEditsRef = useRef(chordEdits);
  chordEditsRef.current = chordEdits;
  const chordsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(false);
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const editingSong = editingKeyId ? filtered.find((s) => s.id === editingKeyId) ?? null : null;
  const [focusedInput, setFocusedInput] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  async function handleKeyChange(s: SetlistSectionWithSong, key: string) {
    const res = await fetch(`/api/setlists/${setlist.id}/sections`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ id: s.id, song_key: key }] }),
    });
    if (!res.ok) {
      toast.error("Failed to update key");
      return;
    }
    onSectionsChange((prev) =>
      prev.map((sec) => (sec.id === s.id ? { ...sec, song_key: key } : sec))
    );
    setEditingKeyId(null);
  }

  async function saveChordEdits() {
    if (isPast || isGuest) return;
    const currentEdits = chordEditsRef.current;
    let savedAny = false;
    for (const s of filtered) {
      const edited = currentEdits[`${s.id}-chords`];
      if (edited !== undefined && edited !== (s.songs.chords ?? "")) {
        const res = await fetch(`/api/songs/${s.song_id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chords: edited }),
        });
        if (!res.ok) {
          toast.error(`Failed to save chords for "${s.songs.title}"`);
          return;
        }
        savedAny = true;
      }
    }
    if (savedAny) {
      onSectionsChange((prev) =>
        prev.map((sec) => {
          const chordsEdit = currentEdits[`${sec.id}-chords`];
          return {
            ...sec,
            ...(chordsEdit !== undefined
              ? { songs: { ...sec.songs, chords: chordsEdit } }
              : {}),
          };
        })
      );
    }
  }

  function handleChordsChange(id: string, value: string) {
    if (isGuest) return;
    isDirtyRef.current = true;
    setChordEdits((prev) => {
      const next = { ...prev, [id]: value };
      if (chordsTimer.current) clearTimeout(chordsTimer.current);
      chordsTimer.current = setTimeout(saveChordEdits, AUTO_SAVE_DELAY);
      return next;
    });
  }

  useEffect(() => {
    return () => {
      if (chordsTimer.current) clearTimeout(chordsTimer.current);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleCloseRef = useRef<() => void>(() => {});
  handleCloseRef.current = async () => {
    if (isPast) {
      toast.error("Can't edit past lineups");
      onClose();
      return;
    }

    if (isGuest) {
      onClose();
      return;
    }

    if (chordsTimer.current) clearTimeout(chordsTimer.current);

    if (isDirtyRef.current) {
      await saveChordEdits();
    }

    onClose();
  };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleCloseRef.current();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fontSize = ZOOM_STEPS[zoomIndex];

  function renderChordsTextarea(s: SetlistSectionWithSong) {
    return (
      <textarea
        name={`${s.id}-chords`}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        autoCapitalize="off"
        ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }}
        value={chordEdits[`${s.id}-chords`] ?? s.songs.chords ?? ""}
        onChange={(e) => {
          handleChordsChange(`${s.id}-chords`, e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = e.target.scrollHeight + "px";
        }}
        readOnly={isPast || isGuest}
        onFocus={(e) => {
          if (isPast) { e.target.blur(); toast.error("Can't edit past lineups"); return; }
          if (isGuest) { e.target.blur(); toast.error("Guests can't edit lineups"); return; }
          setFocusedInput(true);
          const el = e.target;
          setTimeout(() => {
            el.scrollIntoView({ block: "center", behavior: "smooth" });
          }, 300);
        }}
        onBlur={() => setFocusedInput(false)}
        placeholder="No chords available."
        className="w-full rounded-lg px-3 py-2 leading-relaxed outline-none resize-none overflow-hidden"
        style={{
          fontFamily: "'Courier New', Courier, monospace",
          fontSize,
          fontWeight: "bold",
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--color-surface-card)",
          color: "var(--color-accent)",
        }}
      />
    );
  }

  function renderSongHeader(s: SetlistSectionWithSong) {
    return (
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-base font-semibold break-words" style={{ color: "var(--color-text)" }}>
            {s.songs.title}
          </h3>
          {s.songs.author && (
            <p className="text-xs shrink-0" style={{ color: "var(--color-text-tertiary)" }}>
              {s.songs.author}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => { if (!isPast && !isGuest) setEditingKeyId(s.id); }}
            disabled={isPast || isGuest}
            className="text-xs font-mono font-semibold rounded px-1.5 min-h-[44px] sm:min-h-[22px] flex items-center transition-colors disabled:opacity-60"
            style={{
              backgroundColor: "var(--color-badge-key)",
              color: "var(--color-badge-key-text)",
            }}
          >
            Key: {s.song_key ?? s.songs.default_key ?? "G"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center cursor-pointer"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", height: "100dvh" }}
      onClick={() => handleCloseRef.current()}
    >
      <div
        ref={containerRef}
        className="relative w-full max-w-2xl max-h-[85dvh] overflow-y-auto rounded-t-xl sm:rounded-xl p-5 sm:p-6 pb-[env(safe-area-inset-bottom,16px)] sm:pb-6 backdrop-blur-xl"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          ...(focusedInput && isMobile ? { paddingBottom: "40dvh" } : {}),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-xl font-bold"
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
              className="text-xs font-medium tabular-nums min-w-[2.5rem] text-center"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {fontSize}px
            </span>
            <button
              onClick={() => setZoomIndex(Math.min(ZOOM_STEPS.length - 1, zoomIndex + 1))}
              disabled={zoomIndex === ZOOM_STEPS.length - 1}
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

        <div className="flex flex-col">
          {filtered.map((s, i) => (
            <div key={s.id}>
              {i > 0 && <hr className="mb-4" style={{ borderColor: "var(--color-border)" }} />}
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
                {renderSongHeader(s)}
                {s.notes && (
                  <p className="text-xs mb-2 italic leading-relaxed" style={{ color: "var(--color-accent)" }}>
                    &ldquo;{s.notes}&rdquo;
                  </p>
                )}
                {renderChordsTextarea(s)}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
              No songs in this section.
            </p>
          )}
        </div>
      </div>
      {editingSong && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center p-4"
          onClick={() => setEditingKeyId(null)}
        >
          <div
            className="rounded-xl p-4 shadow-2xl"
            style={{
              backgroundColor: "var(--color-surface-card)",
              border: "1px solid var(--color-border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <KeyPicker
              value={editingSong.song_key ?? editingSong.songs.default_key ?? "G"}
              onChange={(key) => handleKeyChange(editingSong, key)}
              onCancel={() => setEditingKeyId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
