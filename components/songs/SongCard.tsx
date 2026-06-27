"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Song } from "@/lib/type";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type SongCardProps = {
  song: Song;
  onEditRequest?: (id: string) => void;
};

const categoryLabels: Record<string, string> = {
  worship: "Worship",
  praise: "Praise",
};

function isPredefinedCategory(cat: string | null): cat is keyof typeof categoryLabels {
  return cat !== null && cat in categoryLabels;
}

export default function SongCard({ song, onEditRequest }: SongCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleDeleteConfirm() {
    setIsDeleting(true);
    setShowDeleteConfirm(false);
    await fetch(`/api/songs/${song.id}`, { method: "DELETE" });
    router.refresh();
  }

  const showCategoryBadge = !isPredefinedCategory(song.category) && song.category;

  return (
    <div
      className="flex items-center justify-between rounded-lg py-1.5 px-3 transition-colors"
      style={{
        backgroundColor: "var(--color-surface-card)",
      }}
    >
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
          onClick={() => onEditRequest?.(song.id)}
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

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete song?"
          message={`Are you sure you want to delete "${song.title}"? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteConfirm(false)}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
