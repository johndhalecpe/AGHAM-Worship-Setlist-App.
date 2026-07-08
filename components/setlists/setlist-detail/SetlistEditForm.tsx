"use client";

import { useState } from "react";
import DatePicker from "@/components/ui/DatePicker";
import { Setlist } from "@/lib/type";
import { BRANCHES } from "@/lib/branches";

type SetlistEditFormProps = {
  setlist: Setlist;
  onSave: (data: { date: string; title: string; description: string; song_leader: string; branch: string }) => void;
  onCancel: () => void;
  isSaving: boolean;
};

export default function SetlistEditForm({ setlist, onSave, onCancel, isSaving }: SetlistEditFormProps) {
  const [editDate, setEditDate] = useState(setlist.date);
  const [editTitle, setEditTitle] = useState(setlist.title ?? "");
  const [editDescription, setEditDescription] = useState(setlist.description ?? "");
  const [editSongLeader, setEditSongLeader] = useState(setlist.song_leader ?? "");
  const [editBranch, setEditBranch] = useState(setlist.branch);

  function handleSave() {
    if (!editDate) return;
    onSave({
      date: editDate,
      title: editTitle || null,
      description: editDescription || null,
      song_leader: editSongLeader || null,
      branch: editBranch,
    } as any);
  }

  return (
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
          name="setlist-edit-title"
          autoComplete="off"
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
            (e.target.style.borderColor = "var(--color-accent)")
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
          name="setlist-edit-song-leader"
          autoComplete="off"
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
            (e.target.style.borderColor = "var(--color-accent)")
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
            (e.target.style.borderColor = "var(--color-accent)")
          }
          onBlur={(e) =>
            (e.target.style.borderColor = "var(--color-border)")
          }
          rows={3}
        />
      </div>
      <div>
        <label
          className="text-sm font-medium"
          style={{ color: "var(--color-text)" }}
        >
          Branch
        </label>
        <div className="grid grid-cols-2 gap-2 mt-1.5">
          {BRANCHES.map((b) => (
            <button
              key={b.value}
              type="button"
              onClick={() => setEditBranch(b.value)}
              className="rounded-lg px-3 py-2 text-sm font-medium transition-all text-left"
              style={{
                backgroundColor:
                  editBranch === b.value
                    ? "var(--color-accent)"
                    : "var(--color-surface)",
                color:
                  editBranch === b.value
                    ? "#fff"
                    : "var(--color-text-secondary)",
                border:
                  editBranch === b.value
                    ? "1px solid var(--color-accent)"
                    : "1px solid var(--color-border)",
              }}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 justify-end mt-2">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          style={{
            border: "1px solid var(--color-border)",
            color: "var(--color-text-secondary)",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          style={{
            backgroundColor: "var(--color-accent)",
            color: "var(--color-text-on-accent)",
          }}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
