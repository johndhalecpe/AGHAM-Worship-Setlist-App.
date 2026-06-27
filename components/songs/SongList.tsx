"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Song } from "@/lib/type";
import SongCard from "@/components/songs/SongCard";
import SongEditForm from "@/components/songs/SongEditForm";

type SongListProps = {
  songs: Song[];
};

export default function SongList({ songs }: SongListProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(songId: string, data: { title: string; author: string; category: string; language: string }) {
    setIsSaving(true);
    await fetch(`/api/songs/${songId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setIsSaving(false);
    setEditingId(null);
    router.refresh();
  }

  return (
    <>
      {songs.map((song) => (
        editingId === song.id ? (
          <SongEditForm
            key={song.id}
            song={song}
            onSave={(data) => handleSave(song.id, data)}
            onCancel={() => setEditingId(null)}
            isSaving={isSaving}
          />
        ) : (
          <SongCard
            key={song.id}
            song={song}
            onEditRequest={(id) => setEditingId(id)}
          />
        )
      ))}
    </>
  );
}
