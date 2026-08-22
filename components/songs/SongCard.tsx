"use client";

import { memo, useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Song, SongListItem } from "@/lib/type";
import { useIsGuest } from "@/lib/hooks/useIsGuest";
import { markLocalWrite, setRealtimeEditing } from "@/lib/realtime-editing";
import { nashvilleToLetter, letterToNashville, isLetterChordFormat, transposeLetterChords, transposeKey } from "@/lib/chord-conversion";
import {
  COLLAB_SAVE_DELAY_MS,
  useSongCollaboration,
} from "@/lib/hooks/use-song-collaboration";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PresenceAvatars from "@/components/ui/PresenceAvatars";
import ChordsViewer from "@/components/chords/ChordsViewer";
import { authedFetch } from "@/lib/client-fetch";

type SongCardProps = {
  song: SongListItem;
  isLocked?: boolean;
  onEditRequest?: (id: string) => void;
  showMissingTags?: boolean;
};

const categoryLabels: Record<string, string> = {
  worship: "Worship",
  praise: "Praise",
};

function isPredefinedCategory(cat: string | null): cat is keyof typeof categoryLabels {
  return cat !== null && cat in categoryLabels;
}

function SongCard({ song, isLocked, onEditRequest, showMissingTags }: SongCardProps) {
  const router = useRouter();
  const isGuest = useIsGuest();
  const guestLocked = isLocked || isGuest;
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showChords, setShowChords] = useState(false);
  const [chordDisplayMode, setChordDisplayMode] = useState<"nashville" | "letter">("nashville");
  const [transposeOffset, setTransposeOffset] = useState(0);
  const [editingChords, setEditingChords] = useState(false);
  const [chordsDraft, setChordsDraft] = useState("");
  const [chordSaveStatus, setChordSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [lyricsData, setLyricsData] = useState<string | null>(null);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const chordsRef = useRef<HTMLTextAreaElement>(null);
  const chordsDraftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chordAutoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDraftRef = useRef(chordsDraft);
  latestDraftRef.current = chordsDraft;

  const { liveFields, presentBySong, selfId, broadcastField, clearPreview } =
    useSongCollaboration(showChords ? [song.id] : [], {
      enabled: showChords,
      getConfirmedValue: (fieldKey) =>
        fieldKey === "chords" ? (song.chords ?? undefined) : undefined,
      onConflict: (fieldKey, authorName) => {
        if (fieldKey === "chords" && editingChords) {
          toast(`Chords were just updated by ${authorName}`);
        }
      },
    });

  useEffect(() => {
    return () => {
      if (chordsDraftTimer.current) clearTimeout(chordsDraftTimer.current);
      if (chordAutoSaveTimer.current) clearTimeout(chordAutoSaveTimer.current);
    };
  }, []);

  useEffect(() => {
    setRealtimeEditing("songs", editingChords);
    return () => setRealtimeEditing("songs", false);
  }, [editingChords]);

  const chordsPreview = liveFields["chords"];
  const rawChords = chordsPreview?.value ?? song.chords ?? "";
  const displayKey = transposeOffset !== 0 ? transposeKey(song.default_key ?? "G", transposeOffset) : (song.default_key ?? "G");

  const [songConversionFailed, setSongConversionFailed] = useState(false);

  const displayChords = useMemo(() => {
    if (!rawChords) return { text: "", failed: false };
    const isLetterStored = isLetterChordFormat(rawChords);
    const key = song.default_key ?? "G";

    if (chordDisplayMode === "nashville") {
      if (isLetterStored) {
        return { text: rawChords, failed: false };
      }
      return { text: rawChords, failed: false };
    }

    if (isLetterStored) {
      if (transposeOffset !== 0) {
        return { text: transposeLetterChords(rawChords, transposeOffset), failed: false };
      }
      return { text: rawChords, failed: false };
    }

    const result = nashvilleToLetter(rawChords, key);
    if (!result.success) {
      console.warn(`[SongCard] nashvilleToLetter failed for "${song.title}" (key: ${key}):`, result.errors);
    }
    return { text: result.success ? result.output : rawChords, failed: !result.success };
  }, [rawChords, chordDisplayMode, song.default_key, transposeOffset, song.title]);

  useEffect(() => {
    setSongConversionFailed(displayChords.failed);
  }, [displayChords.failed]);

  useEffect(() => {
    setChordsDraft(song.chords ?? "");
  }, [song.chords]);

  async function handleDeleteConfirm() {
    setIsDeleting(true);
    setShowDeleteConfirm(false);
    const res = await authedFetch(`/api/songs/${song.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete song");
      setIsDeleting(false);
      return;
    }
    toast.success("Song deleted");
    router.refresh();
  }

  async function fetchLyrics() {
    if (lyricsData !== null) return lyricsData;
    const res = await fetch(`/api/songs/${song.id}`);
    if (!res.ok) throw new Error("Failed to load song data");
    const data = await res.json();
    setLyricsData(data.lyrics);
    return data.lyrics as string | null;
  }

  async function handleShowLyrics() {
    if (!showLyrics) {
      setLoadingLyrics(true);
      try {
        await fetchLyrics();
      } catch {
        toast.error("Failed to load lyrics");
      }
      setLoadingLyrics(false);
    }
    setShowLyrics(!showLyrics);
  }

  function handleShowChords() {
    if (!showChords) {
      setChordsDraft(song.chords ?? "");
    }
    if (!showChords) {
      if (!guestLocked) {
        setEditingChords(true);
        setTimeout(() => chordsRef.current?.focus(), 0);
      }
    } else {
      setEditingChords(false);
    }
    setShowChords(!showChords);
  }

  function handleChordsDraftChange(value: string) {
    setChordsDraft(value);
    if (chordsDraftTimer.current) clearTimeout(chordsDraftTimer.current);
    chordsDraftTimer.current = setTimeout(() => {
      broadcastField(song.id, "chords", value);
    }, COLLAB_SAVE_DELAY_MS);
    if (chordAutoSaveTimer.current) clearTimeout(chordAutoSaveTimer.current);
    setChordSaveStatus("idle");
    chordAutoSaveTimer.current = setTimeout(async () => {
      const draftToSave = latestDraftRef.current;
      setChordSaveStatus("saving");
      try {
        const res = await authedFetch(`/api/songs/${song.id}`, {
          method: "PATCH",
          body: JSON.stringify({ chords: draftToSave }),
        });
        if (!res.ok) {
          toast.error("Failed to save chords");
          setChordSaveStatus("idle");
          return;
        }
        clearPreview("chords");
        queryClient.setQueryData<Song[]>(["songs"], (old) =>
          old?.map((s) => (s.id === song.id ? { ...s, chords: draftToSave } : s))
        );
        markLocalWrite("songs");
        setRealtimeEditing("songs", false);
        setChordSaveStatus("saved");
        setTimeout(() => setChordSaveStatus("idle"), 2000);
      } catch {
        toast.error("Failed to save chords");
        setChordSaveStatus("idle");
      }
    }, 1200);
  }

  const queryClient = useQueryClient();

  const showCategoryBadge = !isPredefinedCategory(song.category) && song.category;
  const isDraft = song.status === "draft";

  const missingDetails: string[] = [];
  if (isDraft) {
    if (!song.title) missingDetails.push("Title");
    if (!song.author) missingDetails.push("Author");
    if (!song.default_key) missingDetails.push("Key");
  }

  return (
    <div
      className="rounded-lg py-1.5 px-3 transition-colors overflow-x-hidden"
      style={{
        backgroundColor: isDraft ? "color-mix(in srgb, var(--color-surface-card) 100%, #DC2626 8%)" : "var(--color-surface-card)",
      }}
    >
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-sm font-medium truncate block" style={{ color: "var(--color-text)" }}>
              {song.title}
            </span>
            {song.author && (
              <span className="text-xs block mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>
                {song.author}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleShowLyrics}
              disabled={loadingLyrics}
              aria-label={showLyrics ? "Hide lyrics" : "Show lyrics"}
              title={showLyrics ? "Hide lyrics" : "Show lyrics"}
              className="rounded-lg transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center"
              style={{
                backgroundColor: showLyrics ? "var(--color-accent)" : "transparent",
                color: showLyrics ? "var(--color-text-on-accent)" : "var(--color-accent)",
                border: showLyrics ? "none" : "1.5px solid var(--color-accent)",
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={handleShowChords}
              aria-label={showChords ? "Hide chords" : "Show chords"}
              title={showChords ? "Hide chords" : "Show chords"}
              className="rounded-lg transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center"
              style={{
                backgroundColor: showChords ? "var(--color-accent-secondary)" : "transparent",
                color: showChords ? "var(--color-text-on-accent-secondary)" : "var(--color-accent-secondary)",
                border: showChords ? "none" : "1.5px solid var(--color-accent-secondary)",
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M9 4.318A1 1 0 0 1 10.366 3.5l5.19 1.298A1 1 0 0 1 16 5.75v8.534a2.5 2.5 0 0 1-1.744 2.394l-1.838.613a2.5 2.5 0 0 1-3.156-1.662l-.747-2.611A2.5 2.5 0 0 1 9 10.358V4.318Z" />
              </svg>
            </button>
            <div className={`flex items-center gap-1 ${guestLocked ? "invisible" : ""}`}>
              <button
                onClick={() => onEditRequest?.(song.id)}
                className="p-1.5 rounded-lg transition-all hover:-translate-y-0.5 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center"
                style={{ color: "var(--color-accent)" }}
                aria-label="Edit song"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                  <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                </svg>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="p-1.5 rounded-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center"
                style={{ color: "#DC2626" }}
                aria-label="Delete song"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-baseline gap-1 flex-wrap min-w-0">
          {song.default_key && (
            <span className="flex items-center gap-0.5 text-[10px]">
              <button
                onClick={() => setTransposeOffset((o) => o - 1)}
                className="px-1.5 py-0.5 rounded text-[11px] font-semibold transition-colors min-h-[26px] flex items-center justify-center"
                style={{
                  backgroundColor: "var(--color-surface-muted)",
                  color: "var(--color-text-secondary)",
                  visibility: chordDisplayMode === "letter" ? "visible" : "hidden",
                  pointerEvents: chordDisplayMode === "letter" ? "auto" : "none",
                }}
              >
                &minus;1
              </button>
              <span className="flex items-baseline gap-x-0.5 min-w-[4.5rem] justify-center">
                <span style={{ color: "var(--color-accent)" }}>key</span><span className="opacity-50 mx-0.5">:</span><span className="font-medium" style={{ color: transposeOffset !== 0 ? "var(--color-accent)" : "var(--color-text)" }}>{displayKey}</span>
              </span>
              <button
                onClick={() => setTransposeOffset((o) => o + 1)}
                className="px-1.5 py-0.5 rounded text-[11px] font-semibold transition-colors min-h-[26px] flex items-center justify-center"
                style={{
                  backgroundColor: "var(--color-surface-muted)",
                  color: "var(--color-text-secondary)",
                  visibility: chordDisplayMode === "letter" ? "visible" : "hidden",
                  pointerEvents: chordDisplayMode === "letter" ? "auto" : "none",
                }}
              >
                +1
              </button>
            </span>
          )}
          {songConversionFailed && (
            <span className="text-[10px] font-medium" style={{ color: "var(--color-danger)" }}>
              Conversion failed &mdash; check key
            </span>
          )}
        </div>
      </div>

      {showMissingTags && missingDetails.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {missingDetails.map((detail) => (
            <span
              key={detail}
              className="text-xs rounded-full px-2 py-0.5 font-medium"
              style={{
                color: "var(--color-accent)",
                backgroundColor: "color-mix(in srgb, var(--color-accent) 8%, transparent)",
              }}
            >
              {detail}
            </span>
          ))}
        </div>
      )}

      {showLyrics && (
        <div className="mt-1.5">
          {lyricsData ? (
            <pre
              className="w-full rounded-lg px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap"
              style={{
                fontFamily: "inherit",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-secondary)",
                border: "1px solid transparent",
                margin: 0,
                overflow: "hidden",
              }}
            >
              {lyricsData}
            </pre>
          ) : (
            <p className="text-xs italic" style={{ color: "var(--color-text-tertiary)" }}>
              {loadingLyrics ? "Loading..." : "No lyrics yet."}
            </p>
          )}
        </div>
      )}

      {showChords && (
        <div className="mt-1.5">
          {(presentBySong[song.id]?.length ?? 0) > 0 && (
            <div className="flex justify-end mb-1">
              <PresenceAvatars members={presentBySong[song.id] ?? []} selfId={selfId} />
            </div>
          )}
          {!guestLocked && editingChords ? (
            <div className="flex flex-col gap-1.5">
              <ChordsViewer chords={chordsDraft} editable onChange={handleChordsDraftChange} displayMode={chordDisplayMode} />
              <div className="flex gap-1.5 justify-between items-center">
                <span className="text-[10px]" style={{ color: "var(--color-text-tertiary)" }}>
                  {chordSaveStatus === "saving" && "Saving…"}
                  {chordSaveStatus === "saved" && (
                    <span style={{ color: "var(--color-success)" }}>Saved ✓</span>
                  )}
                </span>
                <button
                  onClick={() => {
                    if (chordAutoSaveTimer.current) clearTimeout(chordAutoSaveTimer.current);
                    setEditingChords(false);
                    setShowChords(false);
                    setChordsDraft(song.chords ?? "");
                  }}
                  className="rounded px-2 py-1 text-xs font-medium"
                  style={{
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            song.chords || chordsPreview ? (
              <>
                <ChordsViewer chords={displayChords.text} />
                {chordsPreview && (
                  <p className="text-xs mt-1 animate-preview-pulse" style={{ color: "var(--color-preview-text)" }}>
                    {chordsPreview.authorName} is editing&hellip;
                  </p>
                )}
                <div className="flex items-center gap-1 mt-1.5">
                  <button
                    onClick={() => { setChordDisplayMode("nashville"); setTransposeOffset(0); }}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold transition-colors"
                    style={{
                      backgroundColor: chordDisplayMode === "nashville" ? "var(--color-accent)" : "var(--color-surface-muted)",
                      color: chordDisplayMode === "nashville" ? "#fff" : "var(--color-text-secondary)",
                    }}
                  >
                    Nashville
                  </button>
                  <button
                    onClick={() => setChordDisplayMode("letter")}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold transition-colors"
                    style={{
                      backgroundColor: chordDisplayMode === "letter" ? "var(--color-accent)" : "var(--color-surface-muted)",
                      color: chordDisplayMode === "letter" ? "#fff" : "var(--color-text-secondary)",
                    }}
                  >
                    Letter
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs italic" style={{ color: "var(--color-text-tertiary)" }}>
                No chords yet.
              </p>
            )
          )}
        </div>
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete song?"
          message={`Are you sure you want to delete "${song.title}"? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteConfirm(false)}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}

export default memo(SongCard);