"use client";

import { memo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SongListItem } from "@/lib/type";
import { useIsGuest } from "@/lib/hooks/useIsGuest";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ChordsViewer from "@/components/chords/ChordsViewer";

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
  const [editingChords, setEditingChords] = useState(false);
  const [chordsDraft, setChordsDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [fullData, setFullData] = useState<{ lyrics: string | null; chords: string | null } | null>(null);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [loadingChords, setLoadingChords] = useState(false);
  const chordsRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setChordsDraft(fullData?.chords ?? "");
  }, [fullData?.chords]);

  async function handleDeleteConfirm() {
    setIsDeleting(true);
    setShowDeleteConfirm(false);
    const res = await fetch(`/api/songs/${song.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete song");
      setIsDeleting(false);
      return;
    }
    toast.success("Song deleted");
    router.refresh();
  }

  async function fetchFullData() {
    if (fullData) return fullData;
    const res = await fetch(`/api/songs/${song.id}`);
    if (!res.ok) throw new Error("Failed to load song data");
    const data = await res.json();
    const result = { lyrics: data.lyrics, chords: data.chords };
    setFullData(result);
    return result;
  }

  async function handleShowLyrics() {
    if (!showLyrics) {
      setLoadingLyrics(true);
      try {
        await fetchFullData();
      } catch {
        toast.error("Failed to load lyrics");
      }
      setLoadingLyrics(false);
    }
    setShowLyrics(!showLyrics);
  }

  async function handleShowChords() {
    if (!showChords) {
      setLoadingChords(true);
      try {
        const data = await fetchFullData();
        setChordsDraft(data.chords ?? "");
      } catch {
        toast.error("Failed to load chords");
      }
      setLoadingChords(false);
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

  async function saveChords() {
    setSaving(true);
    const res = await fetch(`/api/songs/${song.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chords: chordsDraft }),
    });
    if (!res.ok) {
      toast.error("Failed to save chords");
      setSaving(false);
      return;
    }
    toast.success("Chords saved");
    setSaving(false);
    setEditingChords(false);
    router.refresh();
  }

  const showCategoryBadge = !isPredefinedCategory(song.category) && song.category;
  const isDraft = song.status === "draft";

  const missingDetails: string[] = [];
  if (isDraft) {
    if (!song.default_key) missingDetails.push("Key");
    if (!song.default_bpm) missingDetails.push("BPM");
    if (!song.default_time_signature) missingDetails.push("Time");
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
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-1"
              style={{
                backgroundColor: showLyrics ? "var(--color-accent)" : "transparent",
                color: showLyrics ? "var(--color-text-on-accent)" : "var(--color-accent)",
                border: showLyrics ? "none" : "1.5px solid var(--color-accent)",
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z" clipRule="evenodd" />
              </svg>
              {loadingLyrics ? "..." : showLyrics ? "Hide" : "Lyrics"}
            </button>
            <button
              onClick={handleShowChords}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-1"
              style={{
                backgroundColor: showChords ? "var(--color-accent-secondary)" : "transparent",
                color: showChords ? "var(--color-text-on-accent-secondary)" : "var(--color-accent-secondary)",
                border: showChords ? "none" : "1.5px solid var(--color-accent-secondary)",
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M9 4.318A1 1 0 0 1 10.366 3.5l5.19 1.298A1 1 0 0 1 16 5.75v8.534a2.5 2.5 0 0 1-1.744 2.394l-1.838.613a2.5 2.5 0 0 1-3.156-1.662l-.747-2.611A2.5 2.5 0 0 1 9 10.358V4.318Z" />
              </svg>
              {loadingChords ? "..." : showChords ? "Hide" : "Chords"}
            </button>
            <div className={`flex items-center gap-1 ${guestLocked ? "invisible" : ""}`}>
              <button
                onClick={() => onEditRequest?.(song.id)}
                className="p-1.5 rounded-lg transition-all hover:-translate-y-0.5 min-h-[36px] min-w-[36px] flex items-center justify-center"
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
                className="p-1.5 rounded-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 min-h-[36px] min-w-[36px] flex items-center justify-center"
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
          {(song.default_key || song.default_bpm || song.default_time_signature) && (
            <span className="flex items-baseline gap-x-0.5 text-[10px]">
              {song.default_key && (<><span style={{ color: "var(--color-accent)" }}>key</span><span className="opacity-50 mx-0.5">:</span><span className="font-medium" style={{ color: "var(--color-text)" }}>{song.default_key}</span></>)}
              {song.default_key && (song.default_bpm || song.default_time_signature) && <span className="mx-0.5" style={{ color: "var(--color-text-tertiary)" }}>·</span>}
              {song.default_bpm && (<><span style={{ color: "var(--color-accent)" }}>bpm</span><span className="opacity-50 mx-0.5">:</span><span className="font-medium" style={{ color: "var(--color-text)" }}>{song.default_bpm}</span></>)}
              {song.default_bpm && song.default_time_signature && <span className="mx-0.5" style={{ color: "var(--color-text-tertiary)" }}>·</span>}
              {song.default_time_signature && (<><span style={{ color: "var(--color-accent)" }}>time</span><span className="opacity-50 mx-0.5">:</span><span className="font-medium" style={{ color: "var(--color-text)" }}>{song.default_time_signature}</span></>)}
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
          {fullData?.lyrics ? (
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
              {fullData.lyrics}
            </pre>
          ) : (
            <p className="text-xs italic" style={{ color: "var(--color-text-tertiary)" }}>
              {fullData === null ? "Loading..." : "No lyrics yet."}
            </p>
          )}
        </div>
      )}

      {showChords && (
        <div className="mt-1.5">
          {!guestLocked && editingChords ? (
            <div className="flex flex-col gap-1.5">
              {loadingChords ? (
                <p className="text-xs italic" style={{ color: "var(--color-text-tertiary)" }}>
                  Loading chords...
                </p>
              ) : (
                <>
                  <ChordsViewer chords={chordsDraft} editable onChange={setChordsDraft} />
                  <div className="flex gap-1.5 justify-end">
                    <button
                      onClick={() => {
                        setEditingChords(false);
                        setShowChords(false);
                        setChordsDraft(fullData?.chords ?? "");
                      }}
                      className="rounded px-2 py-1 text-xs font-medium"
                      style={{
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveChords}
                      disabled={saving}
                      className="rounded px-2 py-1 text-xs font-medium transition-all hover:-translate-y-0.5 disabled:opacity-50"
                      style={{
                        backgroundColor: "var(--color-accent)",
                        color: "white",
                      }}
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            fullData?.chords ? (
              <ChordsViewer chords={fullData.chords} />
            ) : (
              <p className="text-xs italic" style={{ color: "var(--color-text-tertiary)" }}>
                {fullData === null ? "Loading..." : "No chords yet."}
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