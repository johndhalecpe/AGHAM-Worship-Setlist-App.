"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import SongPicker from "@/components/setlists/SongPicker";
import { Setlist, SetlistSectionWithSong } from "@/lib/type";

export default function SetlistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [setlist, setSetlist] = useState<Setlist | null>(null);
  const [sections, setSections] = useState<SetlistSectionWithSong[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSongLeader, setEditSongLeader] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const fetchSetlist = useCallback(async () => {
    const res = await fetch(`/api/setlists/${id}`);
    const data = await res.json();
    setSetlist(data);
  }, [id]);

  const fetchSections = useCallback(async () => {
    const res = await fetch(`/api/setlists/${id}/sections`);
    const data = await res.json();
    setSections(data);
  }, [id]);

  useEffect(() => {
    async function load() {
      await Promise.all([fetchSetlist(), fetchSections()]);
      setLoading(false);
    }
    load();
  }, [fetchSetlist, fetchSections]);

  function startEditing() {
    if (!setlist) return;
    setEditDate(setlist.date);
    setEditTitle(setlist.title ?? "");
    setEditDescription(setlist.description ?? "");
    setEditSongLeader(setlist.song_leader ?? "");
    setEditing(true);
  }

  async function handleSave() {
    if (!editDate) return;
    setSaving(true);
    const res = await fetch(`/api/setlists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: editDate,
        title: editTitle,
        description: editDescription,
        song_leader: editSongLeader,
      }),
    });
    if (res.ok) {
      await fetchSetlist();
      setEditing(false);
    }
    setSaving(false);
  }

  function cancelEditing() {
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this setlist and all its songs?")) return;
    setDeleting(true);
    await fetch(`/api/setlists/${id}`, { method: "DELETE" });
    router.push("/setlists");
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

  const sectionTypes = [
    { key: "worship", label: "Worship songs" },
    { key: "praise", label: "Praise songs" },
    { key: "tithes_offering", label: "Tithes and offering" },
    { key: "special", label: "Special numbers" },
  ];

  if (loading) {
    return <p className="text-neutral-400 text-sm">Loading...</p>;
  }

  if (!setlist) {
    return <p className="text-neutral-400 text-sm">Setlist not found.</p>;
  }

  return (
    <div>
      <div className="mb-8">
        {editing ? (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-700">
                Date
              </label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1.5"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">
                Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1.5"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">
                Description
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1.5"
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">
                Song leader
              </label>
              <input
                type="text"
                value={editSongLeader}
                onChange={(e) => setEditSongLeader(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1.5"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={cancelEditing}
                className="border border-neutral-300 text-neutral-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900">
                  {setlist.date}
                </h2>
                {setlist.title && (
                  <p className="text-neutral-600 mt-1">{setlist.title}</p>
                )}
                {setlist.description && (
                  <p className="text-sm text-neutral-400 italic mt-0.5">
                    {setlist.description}
                  </p>
                )}
                {setlist.song_leader && (
                  <p className="text-sm text-neutral-500 mt-2">
                    Song leader: {setlist.song_leader}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={startEditing}
                  className="border border-neutral-300 text-neutral-700 rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-neutral-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="border border-red-300 text-red-600 rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4">
        {sectionTypes.map((section) => (
          <div
            key={section.key}
            className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5"
          >
            <h3 className="font-semibold text-neutral-900 mb-3">
              {section.label}
            </h3>
            <div className="flex flex-col gap-1">
              {getSectionSongs(section.key).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between text-sm py-2 px-3 rounded-lg hover:bg-neutral-50 -mx-3 transition-colors"
                >
                  <span className="font-medium text-neutral-900">
                    {s.songs.title}
                  </span>
                  {s.songs.author && (
                    <span className="text-neutral-400">{s.songs.author}</span>
                  )}
                </div>
              ))}
            </div>
            {activeSection === section.key ? (
              <SongPicker
                setlistId={id}
                sectionType={section.key}
                onSongAdded={handleSongAdded}
                onCancel={() => setActiveSection(null)}
              />
            ) : (
              <button
                onClick={() => setActiveSection(section.key)}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                + Add song
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
