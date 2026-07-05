"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Setlist, SetlistSectionWithSong, Song } from "@/lib/type";
import { getEffectiveSongKey } from "@/lib/setlistHelpers";
import SongPicker from "@/components/setlists/song-picker/SongPicker";
import SongEditForm from "@/components/songs/SongEditForm";
import KeyPicker from "@/components/ui/KeyPicker";
import LyricsViewer from "./LyricsViewer";
import ChordsViewer from "./ChordsViewer";

type SetlistSectionsProps = {
  setlist: Setlist;
  sections: SetlistSectionWithSong[];
  isPast: boolean;
  isLocked: boolean;
  onSectionsChange: (sections: SetlistSectionWithSong[] | ((prev: SetlistSectionWithSong[]) => SetlistSectionWithSong[])) => void;
};

const SECTION_TYPES = [
  { key: "worship", label: "Worship songs" },
  { key: "praise", label: "Praise songs" },
  { key: "tithes_offering", label: "Tithes and offering" },
  { key: "special", label: "Special numbers" },
];

export default function SetlistSections({
  setlist,
  sections,
  isPast,
  isLocked,
  onSectionsChange,
}: SetlistSectionsProps) {
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [lyricsView, setLyricsView] = useState<{ sectionType: string; songId: string } | null>(null);
  const [chordsView, setChordsView] = useState<{ sectionType: string; songId: string } | null>(null);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [isSavingSong, setIsSavingSong] = useState(false);

  function getSectionSongs(sectionType: string) {
    return sections
      .filter((section) => section.section_type === sectionType)
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

    if (!draggedSectionId || draggedSectionId === targetId) {
      setDraggedSectionId(null);
      return;
    }

    const sectionSongs = getSectionSongs(sectionType);
    const fromIndex = sectionSongs.findIndex((section) => section.id === draggedSectionId);
    const toIndex = sectionSongs.findIndex((section) => section.id === targetId);

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
        (section) => section.section_type !== sectionType
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
    const currentIndex = sectionSongs.findIndex((section) => section.id === songId);
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
        const idx = next.findIndex((section) => section.id === item.id);
        if (idx !== -1) next[idx] = { ...next[idx], sort_order: item.sort_order };
      }
      return next;
    });
  }

  function startEditingNote(sectionId: string, currentNotes: string | null) {
    setEditingNoteId(sectionId);
    setNoteText(currentNotes ?? "");
  }

  function saveNote(sectionId: string) {
    onSectionsChange((prev: SetlistSectionWithSong[]) =>
      prev.map((sec) =>
        sec.id === sectionId ? { ...sec, notes: noteText || null } : sec
      )
    );
    setEditingNoteId(null);
    setNoteText("");
  }

  function cancelNote() {
    setEditingNoteId(null);
    setNoteText("");
  }

  function handleKeyChange(section: SetlistSectionWithSong, key: string) {
    const newSongKey = !key || key === (section.songs.default_key ?? "G") ? null : key;
    onSectionsChange((prev: SetlistSectionWithSong[]) =>
      prev.map((sec) =>
        sec.id === section.id ? { ...sec, song_key: newSongKey } : sec
      )
    );
    toast.success(newSongKey ? `Key changed to ${key} for this session` : `Key reset to default for this session`);
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
    onSectionsChange((prev) => prev.filter((section) => section.id !== sectionId));
  }

  function buildSong(section: SetlistSectionWithSong): Song {
    return {
      id: section.songs.id,
      title: section.songs.title,
      author: section.songs.author,
      category: section.songs.category,
      language: section.songs.language,
      default_key: section.songs.default_key,
      default_bpm: section.songs.default_bpm,
      default_time_signature: section.songs.default_time_signature,
      lyrics: section.songs.lyrics ?? "",
      chords: section.songs.chords ?? "",
      status: section.songs.status ?? "draft",
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
      {SECTION_TYPES.map((section) => {
        const sectionSongs = getSectionSongs(section.key);
        return (
          <div
            key={section.key}
            className={`rounded-xl p-5 transition-colors ${
              draggedSectionId !== null ? "min-h-[80px]" : ""
            }`}
            style={{
              backgroundColor: "var(--color-surface-card)",
              border: "1px solid var(--color-border)",
            }}
          >
            <h3
              className="font-semibold mb-3"
              style={{ color: "var(--color-text)" }}
            >
              {section.label}
            </h3>
            <div className="flex flex-col gap-1">
                {sectionSongs.map((songEntry, songIndex) => {
                const isDragging = draggedSectionId === songEntry.id;
                const isDragOver = dragOverSectionId === songEntry.id;
                const isEditingNote = editingNoteId === songEntry.id;
                const isFirstSong = songIndex === 0;
                const isLastSong = songIndex === sectionSongs.length - 1;
                return (
                  <div key={songEntry.id}>
                      <div
                        draggable={!isPast}
                        onDragStart={() => handleDragStart(songEntry.id)}
                        onDragOver={(e) => handleDragOver(e, songEntry.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, section.key, songEntry.id)}
                        onDragEnd={handleDragEnd}
                        className="flex items-start gap-2 text-sm py-3 px-3 rounded-lg -mx-3 transition-colors"
                        style={{
                          color: "var(--color-text-secondary)",
                          opacity: isDragging ? 0.4 : 1,
                          backgroundColor: isDragOver ? "var(--color-surface-muted)" : "transparent",
                          borderTop: isDragOver && draggedSectionId !== songEntry.id ? "2px solid var(--color-accent)" : "2px solid transparent",
                          borderBottom: songIndex < sectionSongs.length - 1 ? "1px solid var(--color-border)" : "none",
                          cursor: "default",
                        }}
                      >
                        <div className={`flex flex-col items-center gap-0.5 pt-0.5 shrink-0 ${isPast || isLocked ? "invisible" : ""}`}>
                          <button
                            onClick={() => handleMoveSong(section.key, songEntry.id, "up")}
                            disabled={isFirstSong}
                            className="leading-none transition-colors disabled:opacity-20 hover:opacity-80 min-h-[28px] min-w-[28px] flex items-center justify-center rounded"
                            style={{ color: "var(--color-text-tertiary)" }}
                            title="Move up"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => handleMoveSong(section.key, songEntry.id, "down")}
                            disabled={isLastSong}
                            className="leading-none transition-colors disabled:opacity-20 hover:opacity-80 min-h-[28px] min-w-[28px] flex items-center justify-center rounded"
                            style={{ color: "var(--color-text-tertiary)" }}
                            title="Move down"
                          >
                            ▼
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate" style={{ color: "var(--color-text)" }}>
                              {songEntry.songs.title}
                            </span>
                            {songEntry.songs.author && (
                              <span className="text-xs shrink-0" style={{ color: "var(--color-text-tertiary)" }}>
                                {songEntry.songs.author}
                              </span>
                            )}
                            <button
                              onClick={() => startEditingNote(songEntry.id, songEntry.notes)}
                              className={`p-1 rounded shrink-0 min-h-[28px] min-w-[28px] flex items-center justify-center hover:opacity-80 ${isPast || isLocked ? "invisible" : ""}`}
                              style={{
                                color: songEntry.notes ? "var(--color-accent)" : "var(--color-text-tertiary)",
                                opacity: 0.6,
                              }}
                              title={songEntry.notes ? "Edit note" : "Add a note"}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                <path d="M2.695 14.763A1 1 0 0 1 2.001 14v-2.17a1 1 0 0 1 .293-.707l10-10a1 1 0 0 1 1.414 0l2.17 2.17a1 1 0 0 1 0 1.414l-10 10a1 1 0 0 1-.707.293H4a1 1 0 0 1-1-1v-1.17a1 1 0 0 1 .293-.707l9.463-9.464a.5.5 0 0 1 .708.707L3.402 14.056Z" />
                              </svg>
                            </button>

                          </div>
                          {songEntry.notes && !isEditingNote && (
                            <p className="text-xs mt-0.5 italic leading-relaxed truncate" style={{ color: "var(--color-text-tertiary)" }}>
                              &ldquo;{songEntry.notes}&rdquo;
                            </p>
                          )}
                          {isEditingNote && (
                            <div className="mt-1.5 flex flex-col gap-1.5">
                              <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                className="w-full rounded-lg px-2.5 py-1.5 text-xs transition-colors"
                                style={{
                                  border: "1px solid var(--color-border)",
                                  backgroundColor: "var(--color-surface)",
                                  color: "var(--color-text)",
                                }}
                                onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                                rows={2}
                                placeholder="e.g. We're only singing the bridge..."
                                autoFocus
                              />
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => saveNote(songEntry.id)}
                                  className="rounded px-2 py-1 text-xs font-medium transition-colors"
                                  style={{ backgroundColor: "var(--color-accent)", color: "var(--color-text-on-accent)" }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelNote}
                                  className="rounded px-2 py-1 text-xs font-medium transition-colors"
                                  style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                           <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                             {editingKeyId === songEntry.id ? (
                               <KeyPicker
                                 value={getEffectiveSongKey(songEntry)}
                                 onChange={(key) => {
                                   handleKeyChange(songEntry, key);
                                   setEditingKeyId(null);
                                 }}
                                 onCancel={() => setEditingKeyId(null)}
                               />
                             ) : (
                               <button
                                 onClick={() => {
                                   if (isPast) { toast.error("Can't edit past lineups"); return; }
                                   if (!isLocked) setEditingKeyId(songEntry.id);
                                 }}
                                 className={`text-xs font-mono font-semibold rounded px-1.5 min-h-[28px] flex items-center shrink-0 ${!isPast && !isLocked ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                                 style={{
                                   backgroundColor: songEntry.song_key ? "var(--color-accent)" : "var(--color-badge-key)",
                                   color: songEntry.song_key ? "var(--color-text-on-accent)" : "var(--color-badge-key-text)",
                                 }}
                                 title="Tap to change key"
                               >
                                 Key: {getEffectiveSongKey(songEntry)}
                               </button>
                             )}
                             <span
                               className="text-xs font-mono rounded px-1.5 min-h-[28px] flex items-center shrink-0"
                               style={{
                                 backgroundColor: "var(--color-badge-bpm)",
                                 color: "var(--color-badge-bpm-text)",
                               }}
                             >
                               Bpm: {songEntry.songs.default_bpm ?? 120}
                             </span>
                             <span
                               className="text-xs font-mono rounded px-1.5 min-h-[28px] flex items-center shrink-0"
                               style={{
                                 backgroundColor: "var(--color-badge-ts)",
                                 color: "var(--color-badge-ts-text)",
                               }}
                             >
                               {songEntry.songs.default_time_signature ?? "4/4"}
                             </span>
                             <button
                               onClick={() => setChordsView({ sectionType: section.key, songId: songEntry.id })}
                               className="text-xs font-medium rounded px-2 min-h-[28px] flex items-center whitespace-nowrap hover:opacity-80"
                               style={{ backgroundColor: "var(--color-accent)", color: "var(--color-text-on-accent)" }}
                             >
                               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 mr-1">
                                 <path fillRule="evenodd" d="M4 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4Zm6 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V4Zm-6 6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2Zm6 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2Z" clipRule="evenodd" />
                               </svg>
                               Show Chords
                             </button>
                             <button
                               onClick={() => setLyricsView({ sectionType: section.key, songId: songEntry.id })}
                               className="text-xs font-medium rounded px-2 min-h-[28px] flex items-center whitespace-nowrap hover:opacity-80"
                               style={{ backgroundColor: "var(--color-accent)", color: "var(--color-text-on-accent)" }}
                             >
                               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 mr-1">
                                 <path fillRule="evenodd" d="M3 4a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm0 4a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm0 4a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm0 4a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Z" clipRule="evenodd" />
                               </svg>
                               Show Lyrics
                             </button>
                           </div>
                         </div>
                         <div className={`flex flex-col items-center gap-0.5 shrink-0 ${isPast || isLocked ? "invisible" : ""}`}>
                           <button
                             onClick={() => setEditingSong(buildSong(songEntry))}
                             className="p-1 rounded min-h-[28px] min-w-[28px] flex items-center justify-center hover:opacity-80"
                             style={{ color: "var(--color-accent)", opacity: 0.6 }}
                             title="Edit song details"
                           >
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                               <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                               <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                             </svg>
                           </button>
                           <button
                             onClick={() => handleRemoveSongFromSection(songEntry.id)}
                             className="p-1 rounded min-h-[28px] min-w-[28px] flex items-center justify-center hover:opacity-100"
                             style={{ color: "var(--color-danger)", opacity: 0.5 }}
                             title="Remove song"
                           >
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                               <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                             </svg>
                           </button>
                         </div>
                       </div>
                   </div>
                 );
               })}
             </div>
             {sectionSongs.length === 0 && (
              <p
                className="text-xs mb-3"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                No songs in this section yet.
              </p>
            )}
            {!isPast && !isLocked && (
              activeSection === section.key ? (
                <SongPicker
                  setlistId={setlist.id}
                  sectionType={section.key}
                  onSongAdded={handleSongAdded}
                  onCancel={() => setActiveSection(null)}
                />
              ) : (
                <button
                  onClick={() => setActiveSection(section.key)}
                  className="mt-3 text-sm font-medium transition-colors"
                  style={{ color: "var(--color-accent)" }}
                >
                  + Add song
                </button>
              )
            )}
          </div>
        );
      })}
      {chordsView && (
        <ChordsViewer
          setlist={setlist}
          sections={sections}
          sectionType={chordsView.sectionType}
          activeSongId={chordsView.songId}
          isPast={isPast}
          onClose={() => setChordsView(null)}
          onSectionsChange={onSectionsChange}
        />
      )}
      {lyricsView && (
        <LyricsViewer
          sections={sections}
          sectionType={lyricsView.sectionType}
          activeSongId={lyricsView.songId}
          onClose={() => setLyricsView(null)}
        />
      )}
      {editingSong && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
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
    </>
  );
}
