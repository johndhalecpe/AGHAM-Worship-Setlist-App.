"use client";

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
} from "react";
import { toast } from "sonner";
import { Setlist, SetlistSectionWithSong } from "@/lib/type";
import { useIsGuest } from "@/lib/hooks/useIsGuest";
import { markLocalWrite, setRealtimeEditing } from "@/lib/realtime-editing";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { useVisualViewport } from "@/lib/hooks/use-visual-viewport";
import { SONG_NAV_PREFETCH_CACHE, useSongNavigation } from "@/lib/hooks/use-song-navigation";
import { putSongs, type CachedSong } from "@/lib/offline-db";
import {
  useSongCollaboration,
  type LiveField,
  type PresenceMember,
} from "@/lib/hooks/use-song-collaboration";
import KeyPicker from "@/components/ui/KeyPicker";
import PresenceAvatars from "@/components/ui/PresenceAvatars";
import SongNavBar from "./SongNavBar";
import { nashvilleToLetter, letterToNashville, isLetterChordFormat, transposeLetterChords, transposeKey } from "@/lib/chord-conversion";


const ZOOM_STEPS = [12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36];

const SECTION_LABELS: Record<string, string> = {
  worship: "Worship songs",
  praise: "Praise songs",
  tithes_offering: "Tithes and offering",
  special: "Special numbers",
};

const EMPTY_PRESENCE_MEMBERS: PresenceMember[] = [];

type SongBlockProps = {
  section: SetlistSectionWithSong;
  showDivider: boolean;
  fontSize: number;
  isPast: boolean;
  isGuest: boolean;
  chordDraft: string | undefined;
  chordPreview: LiveField | undefined;
  keyPreview: LiveField | undefined;
  members: PresenceMember[];
  selfId: string;
  registerRef: (sectionId: string, el: HTMLDivElement | null) => void;
  onChordsChange: (sectionId: string, value: string) => void;
  onChordsFocus: (sectionId: string, e: FocusEvent<HTMLTextAreaElement>) => void;
  onChordsBlur: () => void;
  onStartKeyEdit: (sectionId: string) => void;
  effectiveDisplayMode: "nashville" | "letter";
  onToggleOverride: (sectionId: string) => void;
};

const SongBlock = memo(function SongBlock({
  section,
  showDivider,
  fontSize,
  isPast,
  isGuest,
  chordDraft,
  chordPreview,
  keyPreview,
  members,
  selfId,
  registerRef,
  onChordsChange,
  onChordsFocus,
  onChordsBlur,
  onStartKeyEdit,
  effectiveDisplayMode,
  onToggleOverride,
}: SongBlockProps) {
  const fieldKey = `${section.id}-chords`;
  const showPreview = chordPreview !== undefined && chordDraft === undefined;
  const rawValue = chordDraft ?? chordPreview?.value ?? section.songs.chords ?? "";
  const baseKey = keyPreview?.value?.trim() || section.song_key?.trim() || section.songs.default_key?.trim() || "G";
  const [transposeOffset, setTransposeOffset] = useState(0);
  const displayedKey = transposeOffset !== 0 ? transposeKey(baseKey, transposeOffset) : baseKey;
  const [conversionFailed, setConversionFailed] = useState(false);

  const value = useMemo(() => {
    const isLetterStored = isLetterChordFormat(rawValue);

    if (effectiveDisplayMode === "nashville") {
      if (isLetterStored) {
        const result = letterToNashville(rawValue, displayedKey);
        if (!result.success) {
          console.warn(`[ChordsViewer] letterToNashville failed for "${section.songs.title}" (key: ${displayedKey}):`, result.errors);
        }
        return { text: result.success ? result.output : rawValue, failed: !result.success };
      }
      return { text: rawValue, failed: false };
    }

    if (isLetterStored) {
      if (transposeOffset !== 0) {
        return { text: transposeLetterChords(rawValue, transposeOffset), failed: false };
      }
      return { text: rawValue, failed: false };
    }

    const result = nashvilleToLetter(rawValue, displayedKey);
    if (!result.success) {
      console.warn(`[ChordsViewer] nashvilleToLetter failed for "${section.songs.title}" (key: ${displayedKey}):`, result.errors);
    }
    return { text: result.success ? result.output : rawValue, failed: !result.success };
  }, [effectiveDisplayMode, rawValue, displayedKey, transposeOffset, section.songs.title]);

  useEffect(() => {
    setConversionFailed(value.failed);
  }, [value.failed]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [rawValue, fontSize]);

  const rootRef = useCallback(
    (el: HTMLDivElement | null) => {
      registerRef(section.id, el);
    },
    [registerRef, section.id]
  );

  return (
    <div ref={rootRef}>
      {showDivider && (
        <hr className="mb-4" style={{ borderColor: "var(--color-border)" }} />
      )}
      <div className="rounded-lg p-4">
        <div className="mb-2">
          <h3 className="text-base font-semibold break-words" style={{ color: "var(--color-text)" }}>
            {section.songs.title}
          </h3>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {section.songs.author && (
                <p className="text-xs truncate" style={{ color: "var(--color-text-tertiary)" }}>
                  {section.songs.author}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <PresenceAvatars members={members} selfId={selfId} />
              <button
                onClick={() => setTransposeOffset((o) => o - 1)}
                className="rounded px-1.5 py-0.5 text-[11px] font-medium transition-all hover:opacity-80 min-h-[26px] flex items-center justify-center"
                style={{
                  backgroundColor: "var(--color-surface-muted)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  visibility: effectiveDisplayMode === "letter" ? "visible" : "hidden",
                  pointerEvents: effectiveDisplayMode === "letter" ? "auto" : "none",
                }}
              >
                &minus;1
              </button>
              <button
                onClick={() => { if (!isPast && !isGuest) onStartKeyEdit(section.id); }}
                disabled={isPast || isGuest}
                className="text-xs font-mono font-semibold rounded px-2 min-h-[44px] sm:min-h-[26px] min-w-[5.5rem] flex items-center justify-center transition-colors disabled:opacity-60"
                style={{
                  backgroundColor: "var(--color-badge-key)",
                  color: "var(--color-badge-key-text)",
                }}
              >
                Key: {displayedKey}
              </button>
              <button
                onClick={() => setTransposeOffset((o) => o + 1)}
                className="rounded px-1.5 py-0.5 text-[11px] font-medium transition-all hover:opacity-80 min-h-[26px] flex items-center justify-center"
                style={{
                  backgroundColor: "var(--color-surface-muted)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  visibility: effectiveDisplayMode === "letter" ? "visible" : "hidden",
                  pointerEvents: effectiveDisplayMode === "letter" ? "auto" : "none",
                }}
              >
                +1
              </button>
            </div>
          </div>
          {keyPreview && (
            <p className="text-xs mt-1 animate-preview-pulse" style={{ color: "var(--color-preview-text)" }}>
              {keyPreview.authorName} is updating the key&hellip;
            </p>
          )}
          {conversionFailed && (
            <p className="text-xs mt-1 font-medium" style={{ color: "var(--color-danger)" }}>
              Chord conversion failed &mdash; check key is valid. Showing raw data.
            </p>
          )}
        </div>
        {section.notes && (
          <p className="text-xs mb-2 italic leading-relaxed" style={{ color: "var(--color-accent)" }}>
            &ldquo;{section.notes}&rdquo;
          </p>
        )}
        <textarea
          ref={textareaRef}
          name={fieldKey}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoCapitalize="off"
          value={value.text}
          onChange={(e) => onChordsChange(section.id, e.target.value)}
          readOnly={isPast || isGuest}
          onFocus={(e) => onChordsFocus(section.id, e)}
          onBlur={onChordsBlur}
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
            {chordPreview.authorName} is editing&hellip;
          </p>
        )}
      </div>
    </div>
  );
});

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
  const orderedSongs = useMemo(() => filtered.map((s) => s.songs), [filtered]);
  const {
    currentSong,
    currentIndex,
    prevSong,
    nextSong,
    hasPrevious,
    hasNext,
    goTo,
  } = useSongNavigation(orderedSongs, null);
  const currentSection = filtered[currentIndex] ?? null;
  const prevSection = currentIndex > 0 ? filtered[currentIndex - 1] : null;
  const nextSection = currentIndex < filtered.length - 1 ? filtered[currentIndex + 1] : null;

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
    if (filtered.length === 0) return;
    const songsToCache: CachedSong[] = filtered.map((s) => ({
      id: s.songs.id,
      title: s.songs.title,
      author: s.songs.author,
      category: s.songs.category,
      language: s.songs.language,
      default_key: s.songs.default_key,
      default_bpm: s.songs.default_bpm,
      default_time_signature: s.songs.default_time_signature,
      lyrics: s.songs.lyrics,
      chords: s.songs.chords,
      status: s.songs.status,
      created_at: s.created_at,
    }));
    putSongs(songsToCache).catch(() => {});
  }, [filtered]);

  function flushCurrentSectionDraft() {
    if (!currentSection) return;
    const edited = chordEditsRef.current[`${currentSection.id}-chords`];
    if (edited !== undefined) {
      chordsQueueRef.current = chordsQueueRef.current
        .catch(() => {})
        .then(() => saveChordField(currentSection, edited));
    }
  }

  const scrollToSong = (sectionId: string) => {
    songRefs.current[sectionId]?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  const suppressScrollSyncRef = useRef(false);

  const handleGoPrevious = () => {
    flushCurrentSectionDraft();
    if (prevSection) {
      suppressScrollSyncRef.current = true;
      window.setTimeout(() => { suppressScrollSyncRef.current = false; }, 1000);
      goTo(prevSection.songs.id);
      scrollToSong(prevSection.id);
    }
  };

  const handleGoNext = () => {
    flushCurrentSectionDraft();
    if (nextSection) {
      suppressScrollSyncRef.current = true;
      window.setTimeout(() => { suppressScrollSyncRef.current = false; }, 1000);
      goTo(nextSection.songs.id);
      scrollToSong(nextSection.id);
    }
  };
  const [zoomIndex, setZoomIndex] = usePersistentState("chords-viewer:zoom-index", 3);
  const [displayMode, setDisplayMode] = usePersistentState<"nashville" | "letter">("chords-viewer:display-mode", "nashville");
  const [songOverrides, setSongOverrides] = useState<Record<string, "nashville" | "letter">>({});
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
  const {
    height: visualViewportHeight,
    offsetTop: visualViewportOffsetTop,
  } = useVisualViewport();

  useEffect(() => {
    setRealtimeEditing("setlist_sections", editingKeyId !== null);
  }, [editingKeyId]);

  const songRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const filteredRef = useRef(filtered);
  filteredRef.current = filtered;
  const isGuestRef = useRef(isGuest);
  isGuestRef.current = isGuest;
  const currentSectionId = currentSection?.id ?? null;
  const currentSongId = currentSong?.id ?? null;
  const [initialSectionId] = useState(currentSectionId);
  const [initialSongId] = useState(() =>
    initialSectionId
      ? filtered.find((s) => s.id === initialSectionId)?.songs.id ?? null
      : null
  );

  // `goTo` gets a new identity whenever `orderedSongs` changes (every chord
  // save replaces the parent's `sections` and re-merges internalSections), so
  // this effect would re-run on every keystroke and snap the modal back to the
  // initial song. It is mount-only by intent: run it exactly once per mount.
  const didInitialScrollRef = useRef(false);

  useEffect(() => {
    if (didInitialScrollRef.current) return;
    didInitialScrollRef.current = true;
    if (initialSectionId && initialSongId) {
      songRefs.current[initialSectionId]?.scrollIntoView({ block: "start" });
      goTo(initialSongId);
    }
  }, [initialSectionId, initialSongId, goTo]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || filtered.length === 0) return;
    let ticking = false;
    const sync = () => {
      ticking = false;
      if (suppressScrollSyncRef.current) return;
      // While a chord field is focused, keyboard/caret-induced container
      // scrolls must not rewrite the URL (and trigger refetches).
      if (focusedFieldRef.current !== null) return;
      const line = container.getBoundingClientRect().top;
      let detected: SetlistSectionWithSong | null = null;
      for (const s of filtered) {
        const el = songRefs.current[s.id];
        if (!el) continue;
        if (el.getBoundingClientRect().bottom > line) { detected = s; break; }
      }
      if (detected && detected.songs.id !== currentSongId) {
        goTo(detected.songs.id);
      }
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(sync);
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [filtered, goTo, currentSongId]);

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

  const saveChordFieldRef = useRef(saveChordField);
  saveChordFieldRef.current = saveChordField;

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

  const handleChordsChange = useCallback((sectionId: string, value: string) => {
    if (isGuestRef.current) return;
    const fieldKey = `${sectionId}-chords`;
    isDirtyRef.current = true;
    setChordEdits((prev) => ({ ...prev, [fieldKey]: value }));
    chordsQueueRef.current = chordsQueueRef.current
      .catch(() => {})
      .then(() => {
        const s = filteredRef.current.find((sec) => sec.id === sectionId);
        if (s) return saveChordFieldRef.current(s, value);
      });
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

  const registerSongRef = useCallback((sectionId: string, el: HTMLDivElement | null) => {
    songRefs.current[sectionId] = el;
  }, []);

  const handleChordsFocus = useCallback((sectionId: string, e: FocusEvent<HTMLTextAreaElement>) => {
    if (isPast) { e.target.blur(); toast.error("Can't edit past lineups"); return; }
    if (isGuestRef.current) { e.target.blur(); toast.error("Guests can't edit lineups"); return; }
    const fieldKey = `${sectionId}-chords`;
    focusedFieldRef.current = fieldKey;
    setFocusedInput(true);
    setEditingChordId(sectionId);
    setRealtimeEditing("songs", true);
    const el = e.target;
    setTimeout(() => {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 300);
  }, [isPast]);

  const handleChordsBlur = useCallback(() => {
    focusedFieldRef.current = null;
    setFocusedInput(false);
    setEditingChordId(null);
    setRealtimeEditing("songs", false);
  }, []);

  const handleStartKeyEdit = useCallback((sectionId: string) => {
    setEditingKeyId(sectionId);
  }, []);

  const handleUniversalToggle = useCallback((mode: "nashville" | "letter") => {
    setDisplayMode(mode);
    setSongOverrides({});
  }, [setDisplayMode]);

  const handleToggleSongOverride = useCallback((sectionId: string) => {
    setSongOverrides((prev) => {
      const current = prev[sectionId];
      if (current !== undefined) {
        const next = { ...prev };
        delete next[sectionId];
        return next;
      }
      const opposite = displayMode === "nashville" ? "letter" : "nashville";
      return { ...prev, [sectionId]: opposite };
    });
  }, [displayMode]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center cursor-pointer"
      style={{
        backgroundColor: "rgba(0,0,0,0.7)",
        ...(visualViewportHeight !== null
          ? { top: visualViewportOffsetTop, height: visualViewportHeight }
          : { height: "100dvh" }),
      }}
      onClick={() => handleCloseRef.current()}
    >
      <div
        ref={containerRef}
        className="relative w-full max-w-2xl max-h-[85dvh] overflow-y-auto rounded-t-xl sm:rounded-xl px-4 sm:px-5 pt-2 pb-[env(safe-area-inset-bottom,16px)] sm:pb-5 backdrop-blur-xl"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          ...(visualViewportHeight !== null
            ? { maxHeight: Math.round(visualViewportHeight * 0.85) }
            : {}),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sticky top-0 z-10 flex items-center justify-between py-2 mb-2"
          style={{
            backgroundColor: "var(--color-surface)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <h2
            className="text-sm font-bold shrink-0"
            style={{ color: "var(--color-text)" }}
          >
            {SECTION_LABELS[sectionType] || sectionType}
          </h2>
          <div className="flex items-center gap-1.5">
            <div
              className="flex rounded overflow-hidden"
              style={{ border: "1px solid var(--color-border)" }}
            >
              <button
                onClick={() => handleUniversalToggle("nashville")}
                className="px-2 py-0.5 text-[11px] font-medium transition-all min-h-[28px]"
                style={{
                  backgroundColor: displayMode === "nashville" ? "var(--color-accent)" : "var(--color-surface-muted)",
                  color: displayMode === "nashville" ? "#fff" : "var(--color-text-secondary)",
                }}
              >
                Nashville
              </button>
              <button
                onClick={() => handleUniversalToggle("letter")}
                className="px-2 py-0.5 text-[11px] font-medium transition-all min-h-[28px]"
                style={{
                  backgroundColor: displayMode === "letter" ? "var(--color-accent)" : "var(--color-surface-muted)",
                  color: displayMode === "letter" ? "#fff" : "var(--color-text-secondary)",
                }}
              >
                Letter
              </button>
            </div>
            <button
              onClick={() => setZoomIndex(Math.max(0, zoomIndex - 1))}
              disabled={zoomIndex === 0}
              className="rounded px-1.5 py-0.5 text-xs font-medium transition-all disabled:opacity-30 hover:opacity-80 min-h-[28px] flex items-center justify-center"
              style={{
                backgroundColor: "var(--color-surface-muted)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
              }}
              aria-label="Zoom out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M2 10a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Z" />
              </svg>
            </button>
            <span
              className="text-[11px] font-medium tabular-nums min-w-[2rem] text-center"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {fontSize}px
            </span>
            <button
              onClick={() => setZoomIndex(Math.min(ZOOM_STEPS.length - 1, zoomIndex + 1))}
              disabled={zoomIndex === ZOOM_STEPS.length - 1}
              className="rounded px-1.5 py-0.5 text-xs font-medium transition-all disabled:opacity-30 hover:opacity-80 min-h-[28px] flex items-center justify-center"
              style={{
                backgroundColor: "var(--color-surface-muted)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
              }}
              aria-label="Zoom in"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M10.75 3.25a.75.75 0 0 0-1.5 0v6h-6a.75.75 0 0 0 0 1.5h6v6a.75.75 0 0 0 1.5 0v-6h6a.75.75 0 0 0 0-1.5h-6v-6Z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-col">
          {filtered.map((s, i) => (
            <SongBlock
              key={s.id}
              section={s}
              showDivider={i > 0}
              fontSize={fontSize}
              isPast={isPast}
              isGuest={isGuest}
              chordDraft={chordEdits[`${s.id}-chords`]}
              chordPreview={liveFields[`${s.id}-chords`]}
              keyPreview={liveFields[`${s.id}-song_key`]}
              members={presentBySong[s.songs.id] ?? EMPTY_PRESENCE_MEMBERS}
              selfId={selfId}
              registerRef={registerSongRef}
              onChordsChange={handleChordsChange}
              onChordsFocus={handleChordsFocus}
              onChordsBlur={handleChordsBlur}
              onStartKeyEdit={handleStartKeyEdit}
              effectiveDisplayMode={songOverrides[s.id] ?? displayMode}
              onToggleOverride={handleToggleSongOverride}
            />
          ))}
          {filtered.length === 0 && (
            <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
              No songs in this section.
            </p>
          )}
          {filtered.length > 1 && !focusedInput && (
            <SongNavBar
              hasPrevious={hasPrevious}
              hasNext={hasNext}
              currentIndex={currentIndex}
              totalCount={filtered.length}
              onPrevious={handleGoPrevious}
              onNext={handleGoNext}
            />
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
              value={editingSong.song_key?.trim() || editingSong.songs.default_key?.trim() || "G"}
              onChange={(key) => handleKeyChange(editingSong, key)}
              onCancel={() => setEditingKeyId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}