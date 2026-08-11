"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Setlist, SetlistSectionWithSong } from "@/lib/type";
import { useIsGuest } from "@/lib/hooks/useIsGuest";
import { markLocalWrite, setRealtimeEditing } from "@/lib/realtime-editing";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import {
  useSongCollaboration,
} from "@/lib/hooks/use-song-collaboration";
import KeyPicker from "@/components/ui/KeyPicker";
import PresenceAvatars from "@/components/ui/PresenceAvatars";

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
  isPast?: boolean;
  onClose: () => void;
  onSectionsChange: (sections: SetlistSectionWithSong[] | ((prev: SetlistSectionWithSong[]) => SetlistSectionWithSong[])) => void;
};

export default function ChordsViewer({
  setlist,
  sections,
  sectionType,
  isPast = false,
  onClose,
  onSectionsChange,
}: Props) {
  const isGuest = useIsGuest();
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalSections, setInternalSections] = useState(sections);
  const filtered = useMemo(
    () => internalSections.filter((s) => s.section_type === sectionType),
    [internalSections, sectionType]
  );
  const filteredSongIds = useMemo(() => {
    const seen = new Set<string>();
    for (const s of filtered) seen.add(s.songs.id);
    return Array.from(seen);
  }, [filtered]);
  const [zoomIndex, setZoomIndex] = usePersistentState("chords-viewer:zoom-index", 3);
  const [chordEdits, setChordEdits] = useState<Record<string, string>>({});
  const chordEditsRef = useRef(chordEdits);
  chordEditsRef.current = chordEdits;
  const chordsQueueRef = useRef<Promise<void>>(Promise.resolve());
  const isDirtyRef = useRef(false);
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const focusedFieldRef = useRef<string | null>(null);
  const editingSong = editingKeyId ? filtered.find((s) => s.id === editingKeyId) ?? null : null;
  const [focusedInput, setFocusedInput] = useState(false);
  const [editingChordId, setEditingChordId] = useState<string | null>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  useEffect(() => {
    setRealtimeEditing("setlist_sections", editingKeyId !== null);
  }, [editingKeyId]);

  useEffect(() => {
    setInternalSections((prev) => {
      if (prev === sections) return prev;
      let changed = false;
      const next = sections.map((incoming) => {
        const existing = prev.find((p) => p.id === incoming.id);
        if (!existing) return incoming;
        const draft = chordEditsRef.current[`${incoming.id}-chords`];
        const chordEditing = editingChordId === incoming.id;
        const keyEditing = editingKeyId === incoming.id;
        if (existing === incoming && draft === undefined && !chordEditing && !keyEditing) {
          return existing;
        }
        changed = true;
        if (draft !== undefined || chordEditing) {
          return {
            ...incoming,
            songs: { ...incoming.songs, chords: draft ?? existing.songs.chords },
          };
        }
        if (keyEditing) {
          return { ...incoming, song_key: existing.song_key };
        }
        return incoming;
      });
      return changed ? next : prev;
    });
  }, [sections, editingKeyId, editingChordId]);

  const { liveFields, presentBySong, selfId, broadcastField, clearPreview } =
    useSongCollaboration(filteredSongIds, {
      enabled: !isPast,
      getConfirmedValue: (fieldKey) => {
        if (fieldKey.endsWith("-chords")) {
          const sectionId = fieldKey.slice(0, -"-chords".length);
          return sections.find((sec) => sec.id === sectionId)?.songs.chords ?? undefined;
        }
        if (fieldKey.endsWith("-song_key")) {
          const sectionId = fieldKey.slice(0, -"-song_key".length);
          return sections.find((sec) => sec.id === sectionId)?.song_key ?? undefined;
        }
        return undefined;
      },
      onConflict: (fieldKey, authorName) => {
        if (
          fieldKey.endsWith("-chords") &&
          (fieldKey in chordEdits || focusedFieldRef.current === fieldKey)
        ) {
          toast(`Chords were just updated by ${authorName}`);
        } else if (
          fieldKey.endsWith("-song_key") &&
          (editingKeyId === fieldKey.slice(0, -"-song_key".length) ||
            focusedFieldRef.current === fieldKey)
        ) {
          toast(`Key was just updated by ${authorName}`);
        }
      },
    });

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
    markLocalWrite("setlist_sections");
    broadcastField(s.songs.id, `${s.id}-song_key`, key);
    clearPreview(`${s.id}-song_key`);
    onSectionsChange((prev) =>
      prev.map((sec) => (sec.id === s.id ? { ...sec, song_key: key } : sec))
    );
    setEditingKeyId(null);
  }

  async function saveChordField(s: SetlistSectionWithSong, value: string) {
    const fieldKey = `${s.id}-chords`;
    const clearDraft = () =>
      setChordEdits((prev) => {
        if (prev[fieldKey] !== value) return prev;
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
    if (value === (s.songs.chords ?? "")) {
      clearDraft();
      clearPreview(fieldKey);
      return;
    }
    broadcastField(s.songs.id, fieldKey, value);
    const res = await fetch(`/api/songs/${s.song_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chords: value }),
    });
    if (!res.ok) {
      toast.error(`Failed to save chords for "${s.songs.title}"`);
      return;
    }
    markLocalWrite("songs");
    clearDraft();
    clearPreview(fieldKey);
    onSectionsChange((prev) =>
      prev.map((sec) =>
        sec.id === s.id ? { ...sec, songs: { ...sec.songs, chords: value } } : sec
      )
    );
  }

  async function flushDirtyChordFields() {
    for (const s of filtered) {
      const edited = chordEditsRef.current[`${s.id}-chords`];
      if (edited !== undefined) {
        chordsQueueRef.current = chordsQueueRef.current
          .catch(() => {})
          .then(() => saveChordField(s, edited));
      }
    }
    await chordsQueueRef.current;
    isDirtyRef.current = false;
  }

  function handleChordsChange(s: SetlistSectionWithSong, value: string) {
    if (isGuest) return;
    const fieldKey = `${s.id}-chords`;
    isDirtyRef.current = true;
    setChordEdits((prev) => ({ ...prev, [fieldKey]: value }));
    chordsQueueRef.current = chordsQueueRef.current
      .catch(() => {})
      .then(() => saveChordField(s, value));
  }

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

    if (isDirtyRef.current) {
      await flushDirtyChordFields();
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
    const fieldKey = `${s.id}-chords`;
    const draft = chordEdits[fieldKey];
    const preview = liveFields[fieldKey];
    const showPreview = preview !== undefined && draft === undefined;
    return (
      <>
        <textarea
          name={fieldKey}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoCapitalize="off"
          ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }}
          value={draft ?? preview?.value ?? s.songs.chords ?? ""}
          onChange={(e) => {
            handleChordsChange(s, e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
          readOnly={isPast || isGuest}
          onFocus={(e) => {
            if (isPast) { e.target.blur(); toast.error("Can't edit past lineups"); return; }
            if (isGuest) { e.target.blur(); toast.error("Guests can't edit lineups"); return; }
            focusedFieldRef.current = fieldKey;
            setFocusedInput(true);
            setEditingChordId(s.id);
            setRealtimeEditing("songs", true);
            const el = e.target;
            setTimeout(() => {
              el.scrollIntoView({ block: "center", behavior: "smooth" });
            }, 300);
          }}
          onBlur={() => {
            focusedFieldRef.current = null;
            setFocusedInput(false);
            setEditingChordId(null);
            setRealtimeEditing("songs", false);
          }}
          placeholder="No chords available."
          className="w-full rounded-lg px-3 py-2 leading-relaxed outline-none resize-none overflow-hidden"
          style={{
            fontFamily: "'Courier New', Courier, monospace",
            fontSize,
            fontWeight: "bold",
            border: `1px solid ${showPreview ? "var(--color-preview-text)" : "var(--color-border)"}`,
            backgroundColor: showPreview ? "var(--color-preview)" : "var(--color-surface-card)",
            color: "var(--color-chord-text)",
          }}
        />
        {showPreview && (
          <p className="text-xs mt-1 animate-preview-pulse" style={{ color: "var(--color-preview-text)" }}>
            {preview.authorName} is editing&hellip;
          </p>
        )}
      </>
    );
  }

  function renderSongHeader(s: SetlistSectionWithSong) {
    const keyFieldKey = `${s.id}-song_key`;
    const keyPreview = liveFields[keyFieldKey];
    const displayedKey = keyPreview?.value ?? s.song_key ?? s.songs.default_key ?? "G";
    return (
      <div className="mb-2">
        <h3 className="text-base font-semibold break-words" style={{ color: "var(--color-text)" }}>
          {s.songs.title}
        </h3>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {s.songs.author && (
              <p className="text-xs truncate" style={{ color: "var(--color-text-tertiary)" }}>
                {s.songs.author}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PresenceAvatars members={presentBySong[s.songs.id] ?? []} selfId={selfId} />
            <button
              onClick={() => { if (!isPast && !isGuest) setEditingKeyId(s.id); }}
              disabled={isPast || isGuest}
              className="text-xs font-mono font-semibold rounded px-1.5 min-h-[44px] sm:min-h-[22px] flex items-center transition-colors disabled:opacity-60"
              style={{
                backgroundColor: "var(--color-badge-key)",
                color: "var(--color-badge-key-text)",
              }}
            >
              Key: {displayedKey}
            </button>
          </div>
        </div>
        {keyPreview && (
          <p className="text-xs mt-1 animate-preview-pulse" style={{ color: "var(--color-preview-text)" }}>
            {keyPreview.authorName} is updating the key&hellip;
          </p>
        )}
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
              <div className="rounded-lg p-4">
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
          onClick={(e) => { e.stopPropagation(); setEditingKeyId(null); }}
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
