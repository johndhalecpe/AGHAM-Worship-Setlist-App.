"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SetlistSectionWithSong } from "@/lib/type";
import KeyPicker from "@/components/ui/KeyPicker";

type NewSongFormProps = {
  initialTitle: string;
  sectionType: string;
  setlistId: string;
  onCreated: (newSection: SetlistSectionWithSong) => void;
  onCancel: () => void;
};

const SECTION_TO_CATEGORY: Record<string, string | null> = {
  worship: "worship",
  praise: "praise",
  tithes_offering: null,
  special: null,
};

export default function NewSongForm({ initialTitle, sectionType, setlistId, onCreated, onCancel }: NewSongFormProps) {
  const [newTitle, setNewTitle] = useState(initialTitle);
  const [newAuthor, setNewAuthor] = useState("");
  const [newCategory, setNewCategory] = useState("worship");
  const [newLanguage, setNewLanguage] = useState("english");
  const [customCategory, setCustomCategory] = useState("");
  const [defaultKey, setDefaultKey] = useState("");
  const [defaultBpm, setDefaultBpm] = useState<number | null>(null);
  const [defaultTimeSignature, setDefaultTimeSignature] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreateAndAddNewSong() {
    if (!newTitle) return;
    setLoading(true);

    const resolvedCategory =
      newCategory === "other" ? customCategory : newCategory;

    const songResponse = await fetch("/api/songs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle,
        author: newAuthor,
        category: resolvedCategory,
        language: newLanguage,
        default_key: defaultKey || null,
        default_bpm: defaultBpm,
        default_time_signature: defaultTimeSignature || null,
      }),
    });

    if (!songResponse.ok) {
      toast.error("Failed to create song");
      setLoading(false);
      return;
    }

    const newSong = await songResponse.json();

    const sectionRes = await fetch(`/api/setlists/${setlistId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        song_id: newSong.id,
        section_type: sectionType,
      }),
    });

    if (!sectionRes.ok) {
      toast.error("Failed to add song to lineup");
      setLoading(false);
      return;
    }

    const newSection: SetlistSectionWithSong = await sectionRes.json();

    toast.success("Song added");
    setLoading(false);
    onCreated(newSection);
  }

  return (
    <div className="flex flex-col gap-3 mt-3">
      <input
        type="text"
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        placeholder="Title"
        className="rounded-lg px-3 py-2 text-sm transition-colors"
        style={{
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--color-surface-card)",
          color: "var(--color-text)",
        }}
        onFocus={(e) =>
          (e.target.style.borderColor = "#D84F0B")
        }
        onBlur={(e) =>
          (e.target.style.borderColor = "var(--color-border)")
        }
      />
      <input
        type="text"
        value={newAuthor}
        onChange={(e) => setNewAuthor(e.target.value)}
        placeholder="Author (optional)"
        className="rounded-lg px-3 py-2 text-sm transition-colors"
        style={{
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--color-surface-card)",
          color: "var(--color-text)",
        }}
        onFocus={(e) =>
          (e.target.style.borderColor = "#D84F0B")
        }
        onBlur={(e) =>
          (e.target.style.borderColor = "var(--color-border)")
        }
      />
      <div className="flex gap-2">
        {(["worship", "praise", "other"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setNewCategory(opt)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all flex-1"
            style={{
              backgroundColor:
                newCategory === opt
                  ? "#D84F0B"
                  : "var(--color-surface)",
              color:
                newCategory === opt
                  ? "#fff"
                  : "var(--color-text-secondary)",
              border:
                newCategory === opt
                  ? "1px solid #D84F0B"
                  : "1px solid var(--color-border)",
            }}
          >
            {opt === "worship" ? "Worship" : opt === "praise" ? "Praise" : "Other"}
          </button>
        ))}
      </div>
      {newCategory === "other" && (
        <input
          type="text"
          value={customCategory}
          onChange={(e) => setCustomCategory(e.target.value)}
          placeholder="Describe the category"
          className="rounded-lg px-3 py-2 text-sm transition-colors"
          style={{
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface-card)",
            color: "var(--color-text)",
          }}
          onFocus={(e) =>
            (e.target.style.borderColor = "#D84F0B")
          }
          onBlur={(e) =>
            (e.target.style.borderColor = "var(--color-border)")
          }
        />
      )}
      <div>
        <span
          className="text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Language
        </span>
        <div className="flex gap-3 mt-1">
          <label
            className="flex items-center gap-1.5 text-sm"
            style={{ color: "var(--color-text)" }}
          >
            <input
              type="radio"
              name="pickerLanguage"
              value="english"
              checked={newLanguage === "english"}
              onChange={(e) => setNewLanguage(e.target.value)}
              style={{ accentColor: "#D84F0B" }}
            />
            English
          </label>
          <label
            className="flex items-center gap-1.5 text-sm"
            style={{ color: "var(--color-text)" }}
          >
            <input
              type="radio"
              name="pickerLanguage"
              value="filipino"
              checked={newLanguage === "filipino"}
              onChange={(e) => setNewLanguage(e.target.value)}
              style={{ accentColor: "#D84F0B" }}
            />
            Filipino
          </label>
        </div>
      </div>
      <div className="border-t" style={{ borderColor: "var(--color-border)" }} />
      <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>
        Details <span className="font-normal normal-case opacity-70">(optional)</span>
      </p>
      <div>
        <label className="text-xs font-medium" style={{ color: "var(--color-text)" }}>
          Key
        </label>
        <KeyPicker value={defaultKey} onChange={setDefaultKey} />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs font-medium" style={{ color: "var(--color-text)" }}>
            BPM
          </label>
          <input
            type="number"
            value={defaultBpm ?? ""}
            onChange={(e) => setDefaultBpm(e.target.value ? Number(e.target.value) : null)}
            placeholder="120"
            className="w-full rounded-lg px-3 py-1.5 text-sm mt-1 transition-colors"
            style={{
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface-card)",
              color: "var(--color-text)",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#D84F0B")}
            onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium" style={{ color: "var(--color-text)" }}>
            Time
          </label>
          <div className="flex gap-1 mt-1">
            {["4/4", "3/4", "6/8"].map((ts) => (
              <button
                key={ts}
                type="button"
                onClick={() => setDefaultTimeSignature(ts === defaultTimeSignature ? "" : ts)}
                className="rounded-lg px-2 py-1.5 text-xs font-medium transition-all flex-1"
                style={{
                  backgroundColor:
                    defaultTimeSignature === ts
                      ? "#D84F0B"
                      : "var(--color-surface)",
                  color:
                    defaultTimeSignature === ts
                      ? "#fff"
                      : "var(--color-text-secondary)",
                  border:
                    defaultTimeSignature === ts
                      ? "1px solid #D84F0B"
                      : "1px solid var(--color-border)",
                }}
              >
                {ts}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button
        onClick={handleCreateAndAddNewSong}
        disabled={loading}
        className="rounded-lg px-4 py-2 text-sm font-medium transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
        style={{
          backgroundColor: "#D84F0B",
          color: "var(--color-surface-card)",
        }}
      >
        {loading ? "Adding..." : "Add song"}
      </button>
    </div>
  );
}