"use client";

import { useState } from "react";

type NewSongFormProps = {
  initialTitle: string;
  sectionType: string;
  setlistId: string;
  onCreated: () => void;
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
      }),
    });

    const newSong = await songResponse.json();

    await fetch(`/api/setlists/${setlistId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        song_id: newSong.id,
        section_type: sectionType,
      }),
    });

    setLoading(false);
    onCreated();
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
      <select
        value={newCategory}
        onChange={(e) => setNewCategory(e.target.value)}
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
      >
        <option value="worship">Worship</option>
        <option value="praise">Praise</option>
        <option value="other">Other (specify)</option>
      </select>
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
