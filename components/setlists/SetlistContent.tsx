"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SongPicker from "@/components/setlists/SongPicker";
import DatePicker from "@/components/setlists/DatePicker";
import { Setlist, SetlistSectionWithSong } from "@/lib/type";

type Props = {
  initialSetlist: Setlist;
  initialSections: SetlistSectionWithSong[];
  isPast?: boolean;
};

const sectionTypes = [
  { key: "worship", label: "Worship songs" },
  { key: "praise", label: "Praise songs" },
  { key: "tithes_offering", label: "Tithes and offering" },
  { key: "special", label: "Special numbers" },
];

export default function SetlistContent({
  initialSetlist,
  initialSections,
  isPast = false,
}: Props) {
  const router = useRouter();
  const [setlist] = useState(initialSetlist);
  const [sections, setSections] = useState(initialSections);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [editDate, setEditDate] = useState(setlist.date);
  const [editTitle, setEditTitle] = useState(setlist.title ?? "");
  const [editDescription, setEditDescription] = useState(
    setlist.description ?? ""
  );
  const [editSongLeader, setEditSongLeader] = useState(
    setlist.song_leader ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  async function fetchSections() {
    const res = await fetch(`/api/setlists/${setlist.id}/sections`);
    const data = await res.json();
    setSections(data);
  }

  function startEditing() {
    setEditDate(setlist.date);
    setEditTitle(setlist.title ?? "");
    setEditDescription(setlist.description ?? "");
    setEditSongLeader(setlist.song_leader ?? "");
    setEditing(true);
  }

  async function handleSaveAndExit() {
    if (editing) {
      if (!editDate) return;
      setSaving(true);
      await fetch(`/api/setlists/${setlist.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: editDate,
          title: editTitle,
          description: editDescription,
          song_leader: editSongLeader,
        }),
      });
      setSaving(false);
    }
    router.push("/setlists");
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    setShowDeleteConfirm(false);
    const res = await fetch(`/api/setlists/${setlist.id}`, { method: "DELETE" });
    if (!res.ok) {
      setDeleting(false);
      return;
    }
    router.push("/setlists");
    router.refresh();
  }

  async function handleDeleteSong(sectionId: string) {
    await fetch(
      `/api/setlists/${setlist.id}/sections?sectionId=${sectionId}`,
      { method: "DELETE" }
    );
    fetchSections();
  }

  function getSectionSongs(sectionType: string) {
    return sections
      .filter((s) => s.section_type === sectionType)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  function handleSongAdded() {
    fetchSections();
    setActiveSection(null);
  }

  function handleDragStart(sectionId: string) {
    setDraggedId(sectionId);
  }

  function handleDragOver(e: React.DragEvent, sectionId: string) {
    e.preventDefault();
    setDragOverId(sectionId);
  }

  function handleDragLeave() {
    setDragOverId(null);
  }

  async function handleDrop(e: React.DragEvent, sectionType: string, targetId: string) {
    e.preventDefault();
    setDragOverId(null);

    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const sectionSongs = getSectionSongs(sectionType);
    const fromIndex = sectionSongs.findIndex((s) => s.id === draggedId);
    const toIndex = sectionSongs.findIndex((s) => s.id === targetId);

    if (fromIndex === -1 || toIndex === -1) {
      setDraggedId(null);
      return;
    }

    const reordered = [...sectionSongs];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const updated = reordered.map((item, i) => ({
      ...item,
      sort_order: i,
    }));

    setSections((prev) => {
      const otherSections = prev.filter(
        (s) => s.section_type !== sectionType
      );
      return [...otherSections, ...updated];
    });

    await fetch(`/api/setlists/${setlist.id}/sections`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: updated.map((item) => ({
          id: item.id,
          sort_order: item.sort_order,
        })),
      }),
    });

    setDraggedId(null);
  }

  function handleDragEnd() {
    setDraggedId(null);
    setDragOverId(null);
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
    fetchSections();
  }

  function cancelNote() {
    setEditingNoteId(null);
    setNoteText("");
  }

  return (
    <div>
      <div className="mb-8">
        {editing ? (
          <div
            className="rounded-xl p-6 flex flex-col gap-4"
            style={{
              backgroundColor: "var(--color-surface-card)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div>
              <label
                className="text-sm font-medium"
                style={{ color: "var(--color-text)" }}
              >
                Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="e.g. Sunday Morning Service"
                className="w-full rounded-lg px-3 py-2 text-sm mt-1.5 transition-colors"
                style={{
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "#D84F0B")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--color-border)")
                }
              />
            </div>
            <div>
              <label
                className="text-sm font-medium"
                style={{ color: "var(--color-text)" }}
              >
                Date
              </label>
              <DatePicker value={editDate} onChange={setEditDate} />
            </div>
            <div>
              <label
                className="text-sm font-medium"
                style={{ color: "var(--color-text)" }}
              >
                Song leader
              </label>
              <input
                type="text"
                value={editSongLeader}
                onChange={(e) => setEditSongLeader(e.target.value)}
                placeholder="e.g. Kevin Acebuche"
                className="w-full rounded-lg px-3 py-2 text-sm mt-1.5 transition-colors"
                style={{
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "#D84F0B")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--color-border)")
                }
              />
            </div>
            <div>
              <label
                className="text-sm font-medium"
                style={{ color: "var(--color-text)" }}
              >
                Description
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="e.g. Sunday Service"
                className="w-full rounded-lg px-3 py-2.5 text-sm mt-1.5 transition-colors"
                style={{
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "#D84F0B")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--color-border)")
                }
                rows={3}
              />
            </div>

          </div>
        ) : (
          <div
            className="rounded-xl p-6"
            style={{
              backgroundColor: "var(--color-surface-card)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2
                  className="text-xl sm:text-2xl font-bold break-words"
                  style={{ color: "var(--color-text)" }}
                >
                  {setlist.date}
                </h2>
                {setlist.title && (
                  <p
                    className="mt-1 text-sm sm:text-base"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {setlist.title}
                  </p>
                )}
                {setlist.description && (
                  <p
                    className="text-sm italic mt-0.5"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    {setlist.description}
                  </p>
                )}
                {setlist.song_leader && (
                  <p
                    className="text-sm mt-2 flex items-center gap-1.5"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ color: "#D84F0B" }}
                    >
                      <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
                    </svg>
                    {setlist.song_leader}
                  </p>
                )}
              </div>
              {!isPast && (
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={startEditing}
                    className="rounded-lg px-3 py-1 text-xs font-medium transition-colors"
                    style={{
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deleting}
                    className="rounded-lg px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50"
                    style={{
                      border: "1px solid #FCA5A5",
                      color: "#DC2626",
                    }}
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4">
        {sectionTypes.map((section) => {
          const sectionSongs = getSectionSongs(section.key);
          return (
            <div
              key={section.key}
              className={`rounded-xl p-5 transition-colors ${
                draggedId !== null ? "min-h-[80px]" : ""
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
                  {sectionSongs.map((s) => {
                  const isDragging = draggedId === s.id;
                  const isDragOver = dragOverId === s.id;
                  const isEditingNote = editingNoteId === s.id;
                  return (
                    <div key={s.id}>
                      <div
                        draggable={!isPast}
                        onDragStart={() => handleDragStart(s.id)}
                        onDragOver={(e) => handleDragOver(e, s.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, section.key, s.id)}
                        onDragEnd={handleDragEnd}
                        className="flex items-start gap-2 text-sm py-2 px-3 rounded-lg -mx-3 transition-colors"
                        style={{
                          color: "var(--color-text-secondary)",
                          opacity: isDragging ? 0.4 : 1,
                          backgroundColor: isDragOver
                            ? "var(--color-surface-muted)"
                            : "transparent",
                          borderTop:
                            isDragOver && draggedId !== s.id
                              ? "2px solid #D84F0B"
                              : "2px solid transparent",
                          cursor: "default",
                        }}
                      >
                        {!isPast && (
                          <span
                            className="cursor-grab active:cursor-grabbing select-none text-base leading-none pt-0.5"
                            style={{ color: "var(--color-text-tertiary)" }}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            ⋮⋮
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="font-medium truncate"
                              style={{ color: "var(--color-text)" }}
                            >
                              {s.songs.title}
                            </span>
                            {!isPast && (
                              <button
                                onClick={() =>
                                  startEditingNote(s.id, s.notes)
                                }
                                className="p-0.5 rounded shrink-0 transition-colors"
                                style={{
                                  color: s.notes
                                    ? "#D84F0B"
                                    : "var(--color-text-tertiary)",
                                  opacity: 0.6,
                                }}
                                title={
                                  s.notes ? "Edit note" : "Add a note"
                                }
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className="w-3.5 h-3.5"
                                >
                                  <path d="M2.695 14.763A1 1 0 0 1 2.001 14v-2.17a1 1 0 0 1 .293-.707l10-10a1 1 0 0 1 1.414 0l2.17 2.17a1 1 0 0 1 0 1.414l-10 10a1 1 0 0 1-.707.293H4a1 1 0 0 1-1-1v-1.17a1 1 0 0 1 .293-.707l9.463-9.464a.5.5 0 0 1 .708.707L3.402 14.056Z" />
                                </svg>
                              </button>
                            )}
                          </div>
                          {s.notes && !isEditingNote && (
                            <p
                              className="text-xs mt-0.5 italic leading-relaxed truncate"
                              style={{
                                color: "var(--color-text-tertiary)",
                              }}
                            >
                              &ldquo;{s.notes}&rdquo;
                            </p>
                          )}
                          {isEditingNote && (
                            <div className="mt-1.5 flex flex-col gap-1.5">
                              <textarea
                                value={noteText}
                                onChange={(e) =>
                                  setNoteText(e.target.value)
                                }
                                className="w-full rounded-lg px-2.5 py-1.5 text-xs transition-colors"
                                style={{
                                  border:
                                    "1px solid var(--color-border)",
                                  backgroundColor:
                                    "var(--color-surface)",
                                  color: "var(--color-text)",
                                }}
                                onFocus={(e) =>
                                  (e.target.style.borderColor =
                                    "#D84F0B")
                                }
                                onBlur={(e) =>
                                  (e.target.style.borderColor =
                                    "var(--color-border)")
                                }
                                rows={2}
                                placeholder="e.g. We're only singing the bridge..."
                                autoFocus
                              />
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => saveNote(s.id)}
                                  className="rounded px-2 py-1 text-xs font-medium transition-colors"
                                  style={{
                                    backgroundColor: "#D84F0B",
                                    color: "#fff",
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelNote}
                                  className="rounded px-2 py-1 text-xs font-medium transition-colors"
                                  style={{
                                    border:
                                      "1px solid var(--color-border)",
                                    color:
                                      "var(--color-text-secondary)",
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        {s.songs.author && (
                          <span
                            className="shrink-0 mt-0.5"
                            style={{
                              color: "var(--color-text-tertiary)",
                            }}
                          >
                            {s.songs.author}
                          </span>
                        )}
                        {!isPast && (
                          <button
                            onClick={() => handleDeleteSong(s.id)}
                            className="p-1 rounded transition-colors hover:opacity-100 shrink-0 mt-0.5"
                            style={{
                              color: "#DC2626",
                              opacity: 0.5,
                            }}
                            title="Remove song"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-3.5 h-3.5"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        )}
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
              {!isPast && (
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
                    style={{ color: "#D84F0B" }}
                  >
                    + Add song
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-8 flex justify-center">
        {isPast ? (
          <button
            onClick={() => router.push("/setlists")}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all hover:-translate-y-0.5 w-full sm:w-auto"
            style={{
              border: "1px solid var(--color-border)",
              color: "var(--color-text-secondary)",
              backgroundColor: "transparent",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
                clipRule="evenodd"
              />
            </svg>
            Back to lineups
          </button>
        ) : (
          <button
            onClick={handleSaveAndExit}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 w-full sm:w-auto"
            style={{
              backgroundColor: "#D84F0B",
              color: "var(--color-surface-card)",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                clipRule="evenodd"
              />
            </svg>
            Save &amp; exit
          </button>
        )}
      </div>

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="rounded-xl p-6 max-w-sm w-full"
            style={{
              backgroundColor: "var(--color-surface-card)",
              border: "1px solid var(--color-border)",
            }}
          >
            <h3
              className="text-lg font-bold mb-2"
              style={{ color: "var(--color-text)" }}
            >
              Delete lineup?
            </h3>
            <p
              className="text-sm mb-6"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Are you sure you want to delete the lineup for {setlist.date}?
              This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: "#DC2626", color: "#fff" }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
