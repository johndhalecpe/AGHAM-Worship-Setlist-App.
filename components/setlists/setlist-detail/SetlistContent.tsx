"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Setlist, SetlistSectionWithSong } from "@/lib/type";
import SetlistEditForm from "@/components/setlists/setlist-detail/SetlistEditForm";
import SetlistHeader from "@/components/setlists/setlist-detail/SetlistHeader";
import SetlistSections from "@/components/setlists/setlist-detail/SetlistSections";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type SetlistContentProps = {
  initialSetlist: Setlist;
  initialSections: SetlistSectionWithSong[];
  isPast?: boolean;
  isLocked?: boolean;
  onToggleLock?: () => void;
};

export default function SetlistContent({
  initialSetlist,
  initialSections,
  isPast = false,
  isLocked = true,
  onToggleLock,
}: SetlistContentProps) {
  const router = useRouter();
  const [setlist, setSetlist] = useState(initialSetlist);
  const [sections, setSections] = useState(initialSections);

  useEffect(() => {
    setSetlist(initialSetlist);
    setSections(initialSections);
  }, [initialSetlist, initialSections]);

  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const hasEditsRef = useRef(false);

  function startEditing() {
    hasEditsRef.current = true;
    setEditing(true);
  }

  function handleSectionsChange(
    sectionsOrUpdater: SetlistSectionWithSong[] | ((prev: SetlistSectionWithSong[]) => SetlistSectionWithSong[]),
  ) {
    hasEditsRef.current = true;
    setSections(sectionsOrUpdater);
  }

  async function handleSaveAndExit(editData: { date: string; title: string; description: string; song_leader: string; branch: string }) {
    if (!editData.date) return;
    if (!hasEditsRef.current) {
      router.push("/setlists");
      return;
    }
    setIsSaving(true);

    const sectionsPayload = sections.map((s) => ({
      id: s.id,
      sort_order: s.sort_order,
      ...(s.notes !== undefined ? { notes: s.notes } : {}),
      ...(s.song_key !== undefined ? { song_key: s.song_key } : {}),
    }));
    const sectionsRes = await fetch(`/api/setlists/${setlist.id}/sections`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: sectionsPayload }),
    });
    if (!sectionsRes.ok) {
      toast.error("Failed to save lineup changes");
      setIsSaving(false);
      return;
    }

    const response = await fetch(`/api/setlists/${setlist.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: editData.date,
        title: editData.title || null,
        description: editData.description || null,
        song_leader: editData.song_leader || null,
        branch: editData.branch,
      }),
    });
    if (!response.ok) {
      toast.error("Failed to save lineup metadata");
      setIsSaving(false);
      return;
    }
    toast.success("Lineup saved");
    setIsSaving(false);
    router.push("/setlists");
  }

  async function handleDeleteConfirm() {
    setIsDeleting(true);
    setShowDeleteConfirm(false);
    const response = await fetch(`/api/setlists/${setlist.id}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error("Failed to delete lineup");
      setIsDeleting(false);
      return;
    }
    toast.success("Lineup deleted");
    router.push("/setlists");
    router.refresh();
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div>
      <button
        onClick={() => router.push("/setlists")}
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-4 w-fit px-3 py-2 -ml-1 rounded-lg transition-colors"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
        </svg>
        Back to lineups
      </button>
      {isLocked && (
        <div
          className="rounded-xl p-3 mb-4 flex items-center gap-2 text-sm"
          style={{
            backgroundColor: "var(--color-surface-muted)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-secondary)",
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
          </svg>
          This lineup is locked. Unlock to make changes.
        </div>
      )}
      <div className="mb-8">
        {editing ? (
          <SetlistEditForm
            setlist={setlist}
            onSave={handleSaveAndExit}
            onCancel={() => setEditing(false)}
            isSaving={isSaving}
          />
        ) : (
          <SetlistHeader
            setlist={setlist}
            sections={sections}
            isLocked={isLocked}
            isPast={isPast}
            onEdit={startEditing}
            onToggleLock={onToggleLock ?? (() => {})}
            onDeleteRequest={() => setShowDeleteConfirm(true)}
          />
        )}
      </div>
      <SetlistSections
        setlist={setlist}
        sections={sections}
        isPast={isPast}
        isLocked={isLocked}
        onSectionsChange={handleSectionsChange}
      />
      <div className="mt-8 flex justify-center">
        {isPast ? (
          <button
            onClick={() => router.push("/setlists")}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all hover:-translate-y-0.5 w-full sm:w-auto min-h-[44px]"
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
            onClick={() => {
              handleSaveAndExit({
                date: setlist.date,
                title: setlist.title ?? "",
                description: setlist.description ?? "",
                song_leader: setlist.song_leader ?? "",
                branch: setlist.branch,
              });
            }}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 w-full sm:w-auto min-h-[44px]"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "var(--color-text-on-accent)",
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
        <ConfirmDialog
          title="Delete lineup?"
          message={`Are you sure you want to delete the lineup for ${formatDate(setlist.date)}? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteConfirm(false)}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
