"use client";

import { useState } from "react";
import { Setlist, SetlistSectionWithSong } from "@/lib/type";
import SongPicker from "@/components/setlists/song-picker/SongPicker";
import KeyPicker from "@/components/ui/KeyPicker";
import LyricsViewer from "./LyricsViewer";

type SetlistSectionsProps = {
  setlist: Setlist;
  sections: SetlistSectionWithSong[];
  overrides: Record<string, { override_key?: string; override_bpm?: number; override_time_signature?: string }>;
  onOverridesChange: (overrides: Record<string, { override_key?: string; override_bpm?: number; override_time_signature?: string }>) => void;
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
  overrides,
  onOverridesChange,
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
  const [editingBpmId, setEditingBpmId] = useState<string | null>(null);
  const [editingTimeSignatureId, setEditingTimeSignatureId] = useState<string | null>(null);
  const [lyricsView, setLyricsView] = useState<{ sectionType: string; songId: string } | null>(null);

  async function refreshSectionsFromApi() {
    const response = await fetch(`/api/setlists/${setlist.id}/sections`);
    const data = await response.json();
    onSectionsChange(data);
  }

  function getSectionSongs(sectionType: string) {
    return sections
      .filter((s) => s.section_type === sectionType)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  function getEffectiveKey(s: SetlistSectionWithSong) {
    return overrides[s.id]?.override_key || s.songs.default_key || "G";
  }

  function getEffectiveBpm(s: SetlistSectionWithSong) {
    return overrides[s.id]?.override_bpm || s.songs.default_bpm || 120;
  }

  function getEffectiveTimeSignature(s: SetlistSectionWithSong) {
    return overrides[s.id]?.override_time_signature || s.songs.default_time_signature || "4/4";
  }

  function handleSongAdded() {
    refreshSectionsFromApi();
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

  async function handleDrop(e: React.DragEvent, sectionType: string, targetId: string) {
    e.preventDefault();
    setDragOverSectionId(null);

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

    await fetch(`/api/setlists/${setlist.id}/sections`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: updatedSections.map((item) => ({
          id: item.id,
          sort_order: item.sort_order,
        })),
      }),
    });

    setDraggedSectionId(null);
  }

  function handleDragEnd() {
    setDraggedSectionId(null);
    setDragOverSectionId(null);
  }

  async function handleMoveSong(sectionType: string, songId: string, direction: "up" | "down") {
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

    await fetch(`/api/setlists/${setlist.id}/sections`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: updatedItems }),
    });
  }

  function startEditingNote(sectionId: string, currentNotes: string | null) {
    setEditingNoteId(sectionId);
    setNoteText(currentNotes ?? "");
  }

  async function saveNote(sectionId: string) {
    await fetch(`/api/setlists/${setlist.id}/sections`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ id: sectionId, notes: noteText || null }],
      }),
    });
    setEditingNoteId(null);
    refreshSectionsFromApi();
  }

  function cancelNote() {
    setEditingNoteId(null);
    setNoteText("");
  }

  async function handleRemoveSongFromSection(sectionId: string) {
    await fetch(
      `/api/setlists/${setlist.id}/sections?sectionId=${sectionId}`,
      { method: "DELETE" }
    );
    refreshSectionsFromApi();
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
                {sectionSongs.map((s, songIndex) => {
                const isDragging = draggedSectionId === s.id;
                const isDragOver = dragOverSectionId === s.id;
                const isEditingNote = editingNoteId === s.id;
                const isFirstSong = songIndex === 0;
                const isLastSong = songIndex === sectionSongs.length - 1;
                return (
                  <div key={s.id}>
                      <div
                        draggable={!isPast}
                        onDragStart={() => handleDragStart(s.id)}
                        onDragOver={(e) => handleDragOver(e, s.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, section.key, s.id)}
                        onDragEnd={handleDragEnd}
                        className="flex items-start gap-2 text-sm py-3 px-3 rounded-lg -mx-3 transition-colors"
                        style={{
                          color: "var(--color-text-secondary)",
                          opacity: isDragging ? 0.4 : 1,
                          backgroundColor: isDragOver ? "var(--color-surface-muted)" : "transparent",
                          borderTop: isDragOver && draggedSectionId !== s.id ? "2px solid var(--color-accent)" : "2px solid transparent",
                          borderBottom: songIndex < sectionSongs.length - 1 ? "1px solid var(--color-border)" : "none",
                          cursor: "default",
                        }}
                      >
                        <div className={`flex flex-col items-center gap-0.5 pt-0.5 shrink-0 ${isPast || isLocked ? "invisible" : ""}`}>
                          <button
                            onClick={() => handleMoveSong(section.key, s.id, "up")}
                            disabled={isFirstSong}
                            className="leading-none transition-colors disabled:opacity-20 hover:opacity-80 min-h-[28px] min-w-[28px] flex items-center justify-center rounded"
                            style={{ color: "var(--color-text-tertiary)" }}
                            title="Move up"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => handleMoveSong(section.key, s.id, "down")}
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
                              {s.songs.title}
                            </span>
                            {s.songs.author && (
                              <span className="text-xs shrink-0" style={{ color: "var(--color-text-tertiary)" }}>
                                {s.songs.author}
                              </span>
                            )}
                            <button
                              onClick={() => startEditingNote(s.id, s.notes)}
                              className={`p-1 rounded shrink-0 min-h-[28px] min-w-[28px] flex items-center justify-center hover:opacity-80 ${isPast || isLocked ? "invisible" : ""}`}
                              style={{
                                color: s.notes ? "var(--color-accent)" : "var(--color-text-tertiary)",
                                opacity: 0.6,
                              }}
                              title={s.notes ? "Edit note" : "Add a note"}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                <path d="M2.695 14.763A1 1 0 0 1 2.001 14v-2.17a1 1 0 0 1 .293-.707l10-10a1 1 0 0 1 1.414 0l2.17 2.17a1 1 0 0 1 0 1.414l-10 10a1 1 0 0 1-.707.293H4a1 1 0 0 1-1-1v-1.17a1 1 0 0 1 .293-.707l9.463-9.464a.5.5 0 0 1 .708.707L3.402 14.056Z" />
                              </svg>
                            </button>
                          </div>
                          {s.notes && !isEditingNote && (
                            <p className="text-xs mt-0.5 italic leading-relaxed truncate" style={{ color: "var(--color-text-tertiary)" }}>
                              &ldquo;{s.notes}&rdquo;
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
                                  onClick={() => saveNote(s.id)}
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
                            {editingKeyId === s.id ? (
                              <KeyPicker
                                value={getEffectiveKey(s)}
                                onChange={(key) => {
                                  onOverridesChange({
                                    ...overrides,
                                    [s.id]: { ...overrides[s.id], override_key: key === (s.songs.default_key || "G") ? undefined : key },
                                  });
                                  setEditingKeyId(null);
                                }}
                              />
                            ) : (
                              <button
                                onClick={() => !isPast && !isLocked && setEditingKeyId(s.id)}
                                className={`text-xs font-mono font-semibold rounded px-1.5 min-h-[28px] flex items-center shrink-0 ${!isPast && !isLocked ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                                style={{
                                  backgroundColor: overrides[s.id]?.override_key ? "var(--color-accent)" : "var(--color-badge-key)",
                                  color: overrides[s.id]?.override_key ? "var(--color-text-on-accent)" : "var(--color-badge-key-text)",
                                }}
                                title="Tap to change key"
                              >
                                Key: {getEffectiveKey(s)}
                              </button>
                            )}
                            {editingBpmId === s.id ? (
                              <div className="flex items-center gap-0.5">
                                <button
                                  onClick={() => {
                                    const current = getEffectiveBpm(s);
                                    const next = Math.max(40, current - 10);
                                    onOverridesChange({
                                      ...overrides,
                                      [s.id]: { ...overrides[s.id], override_bpm: next === (s.songs.default_bpm || 120) ? undefined : next },
                                    });
                                  }}
                                  className="rounded px-1 min-h-[28px] min-w-[28px] flex items-center justify-center text-xs font-mono font-bold"
                                  style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", backgroundColor: "var(--color-surface)" }}
                                  title="Decrease BPM"
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  defaultValue={getEffectiveBpm(s)}
                                  inputMode="numeric"
                                  className="w-12 rounded px-1 min-h-[28px] text-xs font-mono text-center"
                                  style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                                  autoFocus
                                  onBlur={(e) => {
                                    const val = Number(e.target.value);
                                    if (isNaN(val) || val < 1) return;
                                    onOverridesChange({
                                      ...overrides,
                                      [s.id]: { ...overrides[s.id], override_bpm: val === (s.songs.default_bpm || 120) ? undefined : val },
                                    });
                                    setEditingBpmId(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                    if (e.key === "Escape") setEditingBpmId(null);
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    const current = getEffectiveBpm(s);
                                    const next = Math.min(240, current + 10);
                                    onOverridesChange({
                                      ...overrides,
                                      [s.id]: { ...overrides[s.id], override_bpm: next === (s.songs.default_bpm || 120) ? undefined : next },
                                    });
                                  }}
                                  className="rounded px-1 min-h-[28px] min-w-[28px] flex items-center justify-center text-xs font-mono font-bold"
                                  style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", backgroundColor: "var(--color-surface)" }}
                                  title="Increase BPM"
                                >
                                  +
                                </button>
                                {[80, 120].map((preset) => (
                                  <button
                                    key={preset}
                                    onClick={() => {
                                      onOverridesChange({
                                        ...overrides,
                                        [s.id]: { ...overrides[s.id], override_bpm: preset === (s.songs.default_bpm || 120) ? undefined : preset },
                                      });
                                      setEditingBpmId(null);
                                    }}
                                    className="text-[10px] font-mono rounded px-1.5 min-h-[28px] flex items-center"
                                    style={{
                                      backgroundColor: getEffectiveBpm(s) === preset ? "var(--color-accent)" : "var(--color-badge-bpm)",
                                      color: getEffectiveBpm(s) === preset ? "var(--color-text-on-accent)" : "var(--color-badge-bpm-text)",
                                    }}
                                  >
                                    {preset}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <button
                                onClick={() => !isPast && !isLocked && setEditingBpmId(s.id)}
                                className={`text-xs font-mono rounded px-1.5 min-h-[28px] flex items-center shrink-0 ${!isPast && !isLocked ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                                style={{
                                  backgroundColor: overrides[s.id]?.override_bpm ? "var(--color-accent)" : "var(--color-badge-bpm)",
                                  color: overrides[s.id]?.override_bpm ? "var(--color-text-on-accent)" : "var(--color-badge-bpm-text)",
                                }}
                                title="Tap to change BPM"
                              >
                                Bpm: {getEffectiveBpm(s)}
                              </button>
                            )}
                            {editingTimeSignatureId === s.id ? (
                              <div className="flex items-center gap-0.5">
                                {["4/4", "3/4", "6/8"].map((ts) => (
                                  <button
                                    key={ts}
                                    onClick={() => {
                                      onOverridesChange({
                                        ...overrides,
                                        [s.id]: { ...overrides[s.id], override_time_signature: ts === (s.songs.default_time_signature || "4/4") ? undefined : ts },
                                      });
                                      setEditingTimeSignatureId(null);
                                    }}
                                className={`text-xs font-mono rounded px-1.5 min-h-[28px] flex items-center ${getEffectiveTimeSignature(s) === ts ? "font-bold" : ""}`}
                                  style={{
                                    backgroundColor: getEffectiveTimeSignature(s) === ts ? "var(--color-accent)" : "var(--color-badge-ts)",
                                    color: getEffectiveTimeSignature(s) === ts ? "var(--color-text-on-accent)" : "var(--color-badge-ts-text)",
                                  }}
                                  >
                                    {ts}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <button
                                onClick={() => !isPast && !isLocked && setEditingTimeSignatureId(s.id)}
                                className={`text-xs font-mono rounded px-1.5 min-h-[28px] flex items-center shrink-0 ${!isPast && !isLocked ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                                style={{
                                  backgroundColor: overrides[s.id]?.override_time_signature ? "var(--color-accent)" : "var(--color-badge-ts)",
                                  color: overrides[s.id]?.override_time_signature ? "var(--color-text-on-accent)" : "var(--color-badge-ts-text)",
                                }}
                                title="Tap to change time signature"
                              >
                                {getEffectiveTimeSignature(s)}
                              </button>
                            )}
                            <button
                              onClick={() => setLyricsView({ sectionType: section.key, songId: s.id })}
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
                        <button
                          onClick={() => handleRemoveSongFromSection(s.id)}
                          className={`p-1 rounded shrink-0 min-h-[28px] min-w-[28px] flex items-center justify-center hover:opacity-100 ${isPast || isLocked ? "invisible" : ""}`}
                          style={{ color: "var(--color-danger)", opacity: 0.5 }}
                          title="Remove song"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                          </svg>
                        </button>
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
      {lyricsView && (
        <LyricsViewer
          sections={sections}
          sectionType={lyricsView.sectionType}
          activeSongId={lyricsView.songId}
          onClose={() => setLyricsView(null)}
        />
      )}
    </>
  );
}
