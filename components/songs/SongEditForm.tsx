"use client";

import { useState } from "react";
import { Song } from "@/lib/type";

type SongEditFormProps = {
  song: Song;
  onSave: (data: { title: string; author: string; category: string; language: string }) => void;
  onCancel: () => void;
  isSaving: boolean;
};

const categoryLabels: Record<string, string> = {
  worship: "Worship",
  praise: "Praise",
};

const languageOptions = ["english", "filipino"] as const;
const languageLabels: Record<string, string> = {
  english: "English",
  filipino: "Filipino",
};

function isPredefinedCategory(cat: string | null): cat is keyof typeof categoryLabels {
  return cat !== null && cat in categoryLabels;
}

export default function SongEditForm({ song, onSave, onCancel, isSaving }: SongEditFormProps) {
  const [title, setTitle] = useState(song.title);
  const [author, setAuthor] = useState(song.author ?? "");
  const [category, setCategory] = useState(
    isPredefinedCategory(song.category) ? song.category : "other"
  );
  const [customCategory, setCustomCategory] = useState(
    isPredefinedCategory(song.category) ? "" : (song.category ?? "")
  );
  const [language, setLanguage] = useState(song.language ?? "english");

  function handleSave() {
    if (!title) return;
    const resolvedCategory = category === "other" ? customCategory : category;
    onSave({ title, author, category: resolvedCategory, language });
  }

  return (
    <div className="w-full flex flex-col gap-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Lihim"
        className="w-full rounded-lg px-3 py-2 text-sm"
        style={{
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text)",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#D84F0B")}
        onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
      />
      <input
        type="text"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        placeholder="e.g. Kenneth Acebuche"
        className="w-full rounded-lg px-3 py-2 text-sm"
        style={{
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text)",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#D84F0B")}
        onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
      />
      <div className="flex gap-2">
        {(["worship", "praise", "other"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setCategory(opt)}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-all flex-1"
            style={{
              backgroundColor:
                category === opt
                  ? "#D84F0B"
                  : "var(--color-surface)",
              color:
                category === opt
                  ? "#fff"
                  : "var(--color-text-secondary)",
              border:
                category === opt
                  ? "1px solid #D84F0B"
                  : "1px solid var(--color-border)",
            }}
          >
            {opt === "worship" ? "Worship" : opt === "praise" ? "Praise" : "Other"}
          </button>
        ))}
      </div>
      {category === "other" && (
        <input
          type="text"
          value={customCategory}
          onChange={(e) => setCustomCategory(e.target.value)}
          placeholder="Specify category"
          className="w-full rounded-lg px-3 py-2 text-sm"
          style={{
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text)",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#D84F0B")}
          onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
        />
      )}
      <div>
        <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
          Language
        </span>
        <div className="flex gap-4 mt-1">
          {languageOptions.map((lang) => (
            <label
              key={lang}
              className="flex items-center gap-2 text-sm"
              style={{ color: "var(--color-text)" }}
            >
              <input
                type="radio"
                name={`lang-${song.id}`}
                value={lang}
                checked={language === lang}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ accentColor: "#D84F0B" }}
              />
              {languageLabels[lang]}
            </label>
          ))}
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-sm font-medium"
          style={{
            border: "1px solid var(--color-border)",
            color: "var(--color-text-secondary)",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || !title}
          className="rounded-lg px-3 py-1.5 text-sm font-medium transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          style={{
            backgroundColor: "#D84F0B",
            color: "var(--color-surface-card)",
          }}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
