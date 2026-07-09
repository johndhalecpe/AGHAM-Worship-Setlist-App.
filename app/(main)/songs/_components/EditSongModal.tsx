"use client";

import { useEffect, useRef, useState } from "react";
import { Song } from "@/lib/type";
import { toast } from "sonner";
import SongEditForm from "@/components/songs/SongEditForm";

type EditSongModalProps = {
  songId: string;
  onSave: (data: {
    title: string;
    author: string;
    category: string;
    language: string;
    default_key: string;
    default_bpm: number | null;
    default_time_signature: string;
    lyrics: string;
    chords: string;
  }) => void;
  onCancel: () => void;
  isSaving: boolean;
};

export default function EditSongModal({ songId, onSave, onCancel, isSaving }: EditSongModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    fetch(`/api/songs/${songId}`)
      .then((res) => res.json())
      .then(setSong)
      .catch(() => toast.error("Failed to load song"))
      .finally(() => setLoading(false));
  }, [songId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
    >
      <div
        ref={cardRef}
        className="w-full rounded-xl p-5 sm:p-6 overflow-y-auto max-h-[90vh]"
        style={{
          maxWidth: "540px",
          backgroundColor: "var(--color-surface-card)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold" style={{ color: "var(--color-text)" }}>
            Edit Song
          </h3>
          <button
            onClick={onCancel}
            className="p-1.5 rounded transition-colors hover:opacity-80 min-h-[36px] min-w-[36px] flex items-center justify-center"
            style={{ color: "var(--color-text-tertiary)" }}
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
        {loading ? (
          <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
            Loading song...
          </p>
        ) : song ? (
          <SongEditForm
            song={song}
            onSave={onSave}
            onCancel={onCancel}
            isSaving={isSaving}
          />
        ) : (
          <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
            Failed to load song.
          </p>
        )}
      </div>
    </div>
  );
}
