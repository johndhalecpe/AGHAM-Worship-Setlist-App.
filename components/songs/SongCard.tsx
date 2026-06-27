"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Song } from "@/lib/type";

type SongCardProps = {
  song: Song;
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

export default function SongCard({ song }: SongCardProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [title, setTitle] = useState(song.title);
  const [author, setAuthor] = useState(song.author ?? "");
  const [category, setCategory] = useState(
    isPredefinedCategory(song.category) ? song.category : "other"
  );
  const [customCategory, setCustomCategory] = useState(
    isPredefinedCategory(song.category) ? "" : (song.category ?? "")
  );
  const [language, setLanguage] = useState(song.language ?? "english");

  function resetEditForm() {
    setTitle(song.title);
    setAuthor(song.author ?? "");
    setCategory(isPredefinedCategory(song.category) ? song.category : "other");
    setCustomCategory(isPredefinedCategory(song.category) ? "" : (song.category ?? ""));
    setLanguage(song.language ?? "english");
  }

  async function handleDeleteConfirm() {
    setIsDeleting(true);
    setShowDeleteConfirm(false);
    await fetch(`/api/songs/${song.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleSave() {
    if (!title) return;
    setIsSaving(true);
    const resolvedCategory = category === "other" ? customCategory : category;
    await fetch(`/api/songs/${song.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, author, category: resolvedCategory, language }),
    });
    setIsSaving(false);
    setEditing(false);
    router.refresh();
  }

  function handleCancel() {
    resetEditForm();
    setEditing(false);
  }

  const showCategoryBadge = !isPredefinedCategory(song.category) && song.category;

  return (
    <div
      className="flex items-center justify-between rounded-lg py-1.5 px-3 transition-colors"
      style={{
        backgroundColor: "var(--color-surface-card)",
      }}
    >
      {editing ? (
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
              onClick={handleCancel}
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
      ) : (
        <>
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="text-sm font-medium truncate" style={{ color: "var(--color-text)" }}>
              {song.title}
            </span>
            {song.author && (
              <span className="text-xs truncate" style={{ color: "var(--color-text-tertiary)" }}>
                {song.author}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {showCategoryBadge && (
              <span
                className="text-xs rounded-full px-2 py-0.5 font-medium"
                style={{
                  color: "#D84F0B",
                  backgroundColor: "#D84F0B15",
                }}
              >
                {song.category}
              </span>
            )}
            <button
              onClick={() => setEditing(true)}
              className="p-1 rounded transition-colors"
              style={{ color: "var(--color-text-tertiary)" }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--color-text)")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--color-text-tertiary)")}
              aria-label="Edit song"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
              </svg>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="p-1 rounded transition-colors disabled:opacity-50"
              style={{ color: "#DC2626", opacity: 0.6 }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.opacity = "1")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.opacity = "0.6")}
              aria-label="Delete song"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </>
      )}

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
              Delete song?
            </h3>
            <p
              className="text-sm mb-6"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Are you sure you want to delete &ldquo;{song.title}&rdquo;?
              This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
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
                disabled={isDeleting}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: "#DC2626", color: "#fff" }}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
