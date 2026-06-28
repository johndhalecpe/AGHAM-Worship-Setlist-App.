"use client";

import { useEffect, useRef } from "react";
import { Song } from "@/lib/type";
import SongEditForm from "@/components/songs/SongEditForm";

type EditSongModalProps = {
  song: Song;
  onSave: (data: {
    title: string;
    author: string;
    category: string;
    language: string;
    default_key: string;
    default_bpm: number;
    default_time_signature: string;
    lyrics: string;
  }) => void;
  onCancel: () => void;
  isSaving: boolean;
};

export default function EditSongModal({ song, onSave, onCancel, isSaving }: EditSongModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

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
        <SongEditForm
          song={song}
          onSave={onSave}
          onCancel={onCancel}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}
