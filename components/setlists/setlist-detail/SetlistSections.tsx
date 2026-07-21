"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Setlist, SetlistSectionWithSong, Song } from "@/lib/type";
import { useIsGuest } from "@/lib/hooks/useIsGuest";
import SongPicker from "@/components/setlists/song-picker/SongPicker";
import SongEditForm from "@/components/songs/SongEditForm";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LyricsViewer from "./LyricsViewer";
import ChordsViewer from "./ChordsViewer";

type SetlistSectionsProps = {
  setlist: Setlist;
  sections: SetlistSectionWithSong[];
  sectionOrder: string[] | null;
  isPast: boolean;
  isLocked: boolean;
  onSectionsChange: (sections: SetlistSectionWithSong[] | ((prev: SetlistSectionWithSong[]) => SetlistSectionWithSong[])) => void;
  onSectionOrderChange: (order: string[]) => void;
};

const DEFAULT_SECTION_ORDER = ["worship", "praise", "altar_call", "tithes_offering", "special"];
const SECTION_LABELS: Record<string, string> = {
  worship: "Worship songs",
  praise: "Praise songs",
  altar_call: "Altar Call",
  tithes_offering: "Tithes and offering",
  special: "Special numbers",
};

export default function SetlistSections({
  setlist,
  sections,
  sectionOrder,
  isPast,
  isLocked,
  onSectionsChange,
  onSectionOrderChange,
}: SetlistSectionsProps) {
  const isGuest = useIsGuest();
  const effectiveLock = isPast || isLocked || isGuest;
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [lyricsView, setLyricsView] = useState<{ sectionType: string; songId: string } | null>(null);
  const [chordsView, setChordsView] = useState<{ sectionType: string; songId: string } | null>(null);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [isSavingSong, setIsSavingSong] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [draggedSectionKey, setDraggedSectionKey] = useState<string | null>(null);
  const [dragOverSectionKey, setDragOverSectionKey] = useState<string | null>(null);
  const dropTargetKey = useRef<string | null>(null);
  const activeSectionOrder = sectionOrder ?? DEFAULT_SECTION_ORDER;

  useEffect(() => {
    if (activeSection || editingSong || confirmRemoveId) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [activeSection, editingSong, confirmRemoveId]);

  function handleSectionDragStart(key: string) {
    setDraggedSectionKey(key);
  }

  function handleSectionDragOver(e: React.DragEvent, key: string) {
    e.preventDefault();
    setDragOverSectionKey(key);
    dropTargetKey.current = key;
  }

  function handleSectionDragLeave() {
    setDragOverSectionKey(null);
  }

  function handleSectionDragEnd() {
    const fromKey = draggedSectionKey;
    const toKey = dropTargetKey.current;
    setDraggedSectionKey(null);
    setDragOverSectionKey(null);
    dropTargetKey.current = null;

    if (!fromKey || !toKey || fromKey === toKey) return;

    const fromIndex = activeSectionOrder.indexOf(fromKey);
    const toIndex = activeSectionOrder.indexOf(toKey);
    if (fromIndex === -1 || toIndex === -1) return;

    const next = [...activeSectionOrder];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onSectionOrderChange(next);
  }

  function getSectionSongs(sectionType: string) {
    return sections
      .filter((s) => s.section_type === sectionType)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  function handleSongAdded(newSection: SetlistSectionWithSong) {
    onSectionsChange((prev) => [...prev, newSection]);
  }

  function handleDragStart(sectionId: string) {
    setDraggedSectionId(sectionId);
  }

  function handleDragOver(e: React.DragEvent, sectionId: string) {
    e.preventDefault();
    setDragOverSectionId(sectionId);
  }

  function handleDragLeave() {
    setDragOverSectionId(null);
  }

  function handleDrop(e: React.DragEvent, sectionType: string, targetId: string) {
    e.preventDefault();
    setDragOverSectionId(null);

    if (isGuest) return;
    if (draggedSectionKey) return;

    if (!draggedSectionId || draggedSectionId === targetId) {
      setDraggedSectionId(null);
      return;
    }

    const sectionSongs = getSectionSongs(sectionType);
    const fromIndex = sectionSongs.findIndex((s) => s.id === draggedSectionId);
    const toIndex = sectionSongs.findIndex((s) => s.id === targetId);

    if (fromIndex === -1 || toIndex === -1) {
      setDraggedSectionId(null);
      return;
    }

    const reorderedSections = [...sectionSongs];
    const [movedSection] = reorderedSections.splice(fromIndex, 1);
    reorderedSections.splice(toIndex, 0, movedSection);

    const updatedSections = reorderedSections.map((item, i) => ({
      ...item,
      sort_order: i,
    }));

    onSectionsChange((prev: SetlistSectionWithSong[]) => {
      const otherSections = prev.filter(
        (s) => s.section_type !== sectionType
      );
      return [...otherSections, ...updatedSections];
    });

    setDraggedSectionId(null);
  }

  function handleDragEnd() {
    setDraggedSectionId(null);
    setDragOverSectionId(null);
  }

  function handleMoveSong(sectionType: string, songId: string, direction: "up" | "down") {
    const sectionSongs = getSectionSongs(sectionType);
    const currentIndex = sectionSongs.findIndex((s) => s.id === songId);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sectionSongs.length) return;

    const updatedItems = [
      { id: sectionSongs[currentIndex].id, sort_order: targetIndex },
      { id: sectionSongs[targetIndex].id, sort_order: currentIndex },
    ];

    onSectionsChange((prev: SetlistSectionWithSong[]) => {
      const next = [...prev];
      for (const item of updatedItems) {
        const idx = next.findIndex((s) => s.id === item.id);
        if (idx !== -1) next[idx] = { ...next[idx], sort_order: item.sort_order };
      }
      return next;
    });
  }

  async function handleRemoveSongFromSection(sectionId: string) {
    const res = await fetch(
      `/api/setlists/${setlist.id}/sections?sectionId=${sectionId}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      toast.error("Failed to remove song from lineup");
      return;
    }
    toast.success("Song removed from lineup");
    onSectionsChange((prev) => prev.filter((s) => s.id !== sectionId));
  }

  function buildSong(s: SetlistSectionWithSong): Song {
    return {
      id: s.songs.id,
      title: s.songs.title,
      author: s.songs.author,
      category: s.songs.category,
      language: s.songs.language,
      default_key: s.songs.default_key,
      default_bpm: s.songs.default_bpm,
      default_time_signature: s.songs.default_time_signature,
      lyrics: s.songs.lyrics ?? "",
      chords: s.songs.chords ?? "",
      status: s.songs.status ?? "draft",
      created_at: "",
    };
  }

  async function handleEditSongSave(songId: string, data: {
    title: string;
    author: string;
    category: string;
    language: string;
    default_key: string;
    default_bpm: number | null;
    default_time_signature: string;
    lyrics: string;
    chords: string;
  }) {
    setIsSavingSong(true);
    const res = await fetch(`/api/songs/${songId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      toast.error("Failed to save song");
      setIsSavingSong(false);
      return;
    }
    const updatedSong: Song = await res.json();
    toast.success("Song details saved");
    onSectionsChange((prev: SetlistSectionWithSong[]) =>
      prev.map((sec) =>
        sec.song_id === songId
          ? { ...sec, songs: { ...sec.songs, ...updatedSong } }
          : sec
      )
    );
    setIsSavingSong(false);
    setEditingSong(null);
  }

  return (
    <>
      {activeSectionOrder.map((sectionKey, sectionIndex) => {
        const sectionSongs = getSectionSongs(sectionKey);
        const isSectionDragging = draggedSectionKey === sectionKey;
        const isSectionDragOver = dragOverSectionKey === sectionKey;
        return (
          <div
            key={sectionKey}
            draggable={!effectiveLock}
            onDragStart={() => handleSectionDragStart(sectionKey)}
            onDragOver={(e) => handleSectionDragOver(e, sectionKey)}
            onDragLeave={handleSectionDragLeave}
            onDragEnd={handleSectionDragEnd}
            className="rounded-xl p-4 transition-colors"
            style={{
              backgroundColor: isSectionDragOver ? "var(--color-surface-muted)" : "var(--color-surface-card)",
              border: isSectionDragOver && draggedSectionKey !== sectionKey
                ? "2px solid var(--color-accent)"
                : "1px solid var(--color-border)",
              opacity: isSectionDragging ? 0.4 : 1,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {!effectiveLock && (
                  <div
                    className="flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing"
                    title="Drag to reorder section"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5"
                      style={{ color: "var(--color-text-tertiary)", opacity: 0.4 }}
                    >
                      <path d="M15.5 17C16.3284 17 17 17.6716 17 18.5C17 19.3284 16.3284 20 15.5 20C14.6716 20 14 19.3284 14 18.5C14 17.6716 14.6716 17 15.5 17ZM8.5 17C9.32843 17 10 17.6716 10 18.5C10 19.3284 9.32843 20 8.5 20C7.67157 20 7 19.3284 7 18.5C7 17.6716 7.67157 17 8.5 17ZM15.5 10C16.3284 10 17 10.6716 17 11.5C17 12.3284 16.3284 13 15.5 13C14.6716 13 14 12.3284 14 11.5C14 10.6716 14.6716 10 15.5 10ZM8.5 10C9.32843 10 10 10.6716 10 11.5C10 12.3284 9.32843 13 8.5 13C7.67157 13 7 12.3284 7 11.5C7 10.6716 7.67157 10 8.5 10ZM15.5 3C16.3284 3 17 3.67157 17 4.5C17 5.32843 16.3284 6 15.5 6C14.6716 6 14 5.32843 14 4.5C14 3.67157 14.6716 3 15.5 3ZM8.5 3C9.32843 3 10 3.67157 10 4.5C10 5.32843 9.32843 6 8.5 6C7.67157 6 7 5.32843 7 4.5C7 3.67157 7.67157 3 8.5 3Z" />
                    </svg>
                  </div>
                )}
                <h3
                  className="font-semibold"
                  style={{ color: "var(--color-text)" }}
                >
                  {SECTION_LABELS[sectionKey] ?? sectionKey}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {!effectiveLock && (
                  <button
                    onClick={() => setActiveSection(sectionKey)}
                    className="rounded-xl px-8 py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95 min-h-[44px]"
                    style={{ backgroundColor: "var(--color-accent)", color: "var(--color-text-on-accent)", boxShadow: "0 2px 8px color-mix(in srgb, var(--color-accent) 30%, transparent)" }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5 -ml-0.5 inline-block align-text-bottom">
                      <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                    </svg>
                    Add song
                  </button>
                )}
                {!isPast && (isLocked || isGuest) && (
                  <span className="flex items-center gap-1.5 text-xs italic" style={{ color: "var(--color-text-tertiary)" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                      <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                    </svg>
                    Locked
                  </span>
                )}
              </div>
            </div>
            {sectionSongs.length > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => setChordsView({ sectionType: sectionKey, songId: sectionSongs[0].id })}
                  className="flex-1 text-xs font-semibold rounded-lg px-3 py-2 flex items-center justify-center gap-1.5 transition-all hover:-translate-y-0.5 active:scale-95"
                  style={{ backgroundColor: "transparent", border: "1.5px solid var(--color-accent)", color: "var(--color-accent)" }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M9 4.318A1 1 0 0 1 10.366 3.5l5.19 1.298A1 1 0 0 1 16 5.75v8.534a2.5 2.5 0 0 1-1.744 2.394l-1.838.613a2.5 2.5 0 0 1-3.156-1.662l-.747-2.611A2.5 2.5 0 0 1 9 10.358V4.318Z" />
                  </svg>
                  Chords
                </button>
                <button
                  onClick={() => setLyricsView({ sectionType: sectionKey, songId: sectionSongs[0].id })}
                  className="flex-1 text-xs font-semibold rounded-lg px-3 py-2 flex items-center justify-center gap-1.5 transition-all hover:-translate-y-0.5 active:scale-95"
                  style={{ backgroundColor: "var(--color-accent-secondary)", color: "var(--color-text-on-accent-secondary)" }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z" clipRule="evenodd" />
                  </svg>
                  Lyrics
                </button>
              </div>
            )}
            <div className="flex flex-col gap-1">
                {sectionSongs.map((s, songIndex) => {
                const isDragging = draggedSectionId === s.id;
                const isDragOver = dragOverSectionId === s.id;
                const isFirstSong = songIndex === 0;
                const isLastSong = songIndex === sectionSongs.length - 1;
                return (
                  <div key={s.id}>
                      <div
                        draggable={!effectiveLock}
                        onDragStart={() => handleDragStart(s.id)}
                        onDragOver={(e) => handleDragOver(e, s.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, sectionKey, s.id)}
                        onDragEnd={handleDragEnd}
                        className="flex items-center gap-2 text-sm py-1.5 px-3 rounded-lg -mx-3 transition-colors"
                        style={{
                          color: "var(--color-text-secondary)",
                          opacity: isDragging ? 0.4 : 1,
                          backgroundColor: isDragOver ? "var(--color-surface-muted)" : "transparent",
                          borderTop: isDragOver && draggedSectionId !== s.id ? "2px solid var(--color-accent)" : "2px solid transparent",
                          borderBottom: songIndex < sectionSongs.length - 1 ? "1px solid var(--color-border)" : "none",
                          cursor: "default",
                        }}
                      >
                          {!effectiveLock && (
                            <div
                              className="flex items-center justify-center shrink-0"
                              title="Drag to reorder"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="w-5 h-5"
                                style={{ color: "var(--color-text-tertiary)", opacity: 0.4 }}
                              >
                                <path d="M15.5 17C16.3284 17 17 17.6716 17 18.5C17 19.3284 16.3284 20 15.5 20C14.6716 20 14 19.3284 14 18.5C14 17.6716 14.6716 17 15.5 17ZM8.5 17C9.32843 17 10 17.6716 10 18.5C10 19.3284 9.32843 20 8.5 20C7.67157 20 7 19.3284 7 18.5C7 17.6716 7.67157 17 8.5 17ZM15.5 10C16.3284 10 17 10.6716 17 11.5C17 12.3284 16.3284 13 15.5 13C14.6716 13 14 12.3284 14 11.5C14 10.6716 14.6716 10 15.5 10ZM8.5 10C9.32843 10 10 10.6716 10 11.5C10 12.3284 9.32843 13 8.5 13C7.67157 13 7 12.3284 7 11.5C7 10.6716 7.67157 10 8.5 10ZM15.5 3C16.3284 3 17 3.67157 17 4.5C17 5.32843 16.3284 6 15.5 6C14.6716 6 14 5.32843 14 4.5C14 3.67157 14.6716 3 15.5 3ZM8.5 3C9.32843 3 10 3.67157 10 4.5C10 5.32843 9.32843 6 8.5 6C7.67157 6 7 5.32843 7 4.5C7 3.67157 7.67157 3 8.5 3Z" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium truncate" style={{ color: "var(--color-text)" }}>
                              {s.songs.title.length > 16 ? s.songs.title.slice(0, 16) + "…" : s.songs.title}
                            </span>
                            {s.songs.author && (
                              <span className="text-xs shrink-0" style={{ color: "var(--color-text-tertiary)" }}>
                                {s.songs.author.length > 15 ? s.songs.author.slice(0, 15) + "…" : s.songs.author}
                              </span>
                            )}
                          </div>
                        </div>
                        {!effectiveLock && (
                          <div className="flex flex-col items-center gap-0.5 shrink-0">
                            <button
                              onClick={() => setEditingSong(buildSong(s))}
                              className="p-1.5 rounded min-h-[36px] min-w-[36px] sm:min-h-[30px] sm:min-w-[30px] flex items-center justify-center hover:opacity-80"
                              style={{ color: "var(--color-accent)", opacity: 0.6 }}
                              title="Edit song details"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setConfirmRemoveId(s.id)}
                              className="p-1.5 rounded min-h-[36px] min-w-[36px] sm:min-h-[30px] sm:min-w-[30px] flex items-center justify-center hover:opacity-100"
                              style={{ color: "var(--color-danger)", opacity: 0.55 }}
                              title="Remove song"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                  </div>
                );
              })}
            </div>
            {sectionSongs.length > 0 && !effectiveLock && (
              <p className="text-xs italic text-center mt-2" style={{ color: "var(--color-text-tertiary)", opacity: 0.7 }}>
                Drag to reorder
              </p>
            )}
            {sectionSongs.length === 0 && (
              <p
                className="text-xs mb-3"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                No songs in this section yet.
              </p>
            )}
          </div>
        );
      })}
      {activeSection && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 cursor-pointer"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => setActiveSection(null)}
        >
          <div
            className="w-full rounded-xl p-5 sm:p-6 overflow-y-auto max-h-[90vh]"
            style={{
              maxWidth: "540px",
              backgroundColor: "var(--color-surface-card)",
              border: "1px solid var(--color-border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ color: "var(--color-text)" }}>
                Add a song
              </h3>
              <button
                onClick={() => setActiveSection(null)}
                className="p-1.5 rounded transition-colors hover:opacity-80 min-h-[36px] min-w-[36px] flex items-center justify-center"
                style={{ color: "var(--color-text-tertiary)" }}
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>
            <SongPicker
              setlistId={setlist.id}
              sectionType={activeSection}
              onSongAdded={handleSongAdded}
              onCancel={() => setActiveSection(null)}
            />
          </div>
        </div>
      )}
      {chordsView && (
        <ChordsViewer
          setlist={setlist}
          sections={sections}
          sectionType={chordsView.sectionType}
          isPast={isPast}
          onClose={() => setChordsView(null)}
          onSectionsChange={onSectionsChange}
        />
      )}
      {lyricsView && (
        <LyricsViewer
          sections={sections}
          sectionType={lyricsView.sectionType}
          onClose={() => setLyricsView(null)}
        />
      )}
      {editingSong && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 cursor-pointer"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => setEditingSong(null)}
        >
          <div
            className="w-full rounded-xl p-5 sm:p-6 overflow-y-auto max-h-[90vh]"
            style={{
              maxWidth: "540px",
              backgroundColor: "var(--color-surface-card)",
              border: "1px solid var(--color-border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ color: "var(--color-text)" }}>
                Edit Song
              </h3>
              <button
                onClick={() => setEditingSong(null)}
                className="p-1.5 rounded transition-colors hover:opacity-80 min-h-[36px] min-w-[36px] flex items-center justify-center"
                style={{ color: "var(--color-text-tertiary)" }}
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>
            <SongEditForm
              song={editingSong}
              onSave={(data) => handleEditSongSave(editingSong.id, data)}
              onCancel={() => setEditingSong(null)}
              isSaving={isSavingSong}
            />
          </div>
        </div>
      )}
      {confirmRemoveId && (
        <ConfirmDialog
          title="Remove song"
          message="Are you sure you want to remove this song from the lineup?"
          onConfirm={() => {
            handleRemoveSongFromSection(confirmRemoveId);
            setConfirmRemoveId(null);
          }}
          onCancel={() => setConfirmRemoveId(null)}
        />
      )}
    </>
  );
}
