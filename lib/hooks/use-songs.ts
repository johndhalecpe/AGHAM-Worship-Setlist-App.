"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Song } from "@/lib/type";
import { authedFetch } from "@/lib/client-fetch";

const SONGS_KEY = ["songs"] as const;
const AUTHORS_KEY = ["songs", "authors"] as const;

async function fetchSongs(search?: string): Promise<Song[]> {
  const url = search ? `/api/songs?search=${encodeURIComponent(search)}` : "/api/songs";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch songs");
  return res.json();
}

async function fetchAuthors(): Promise<string[]> {
  const res = await fetch("/api/songs/authors");
  if (!res.ok) throw new Error("Failed to fetch authors");
  return res.json();
}

async function updateSong(id: string, data: Record<string, unknown>): Promise<Song> {
  const res = await authedFetch(`/api/songs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update song");
  return res.json();
}

async function deleteSong(id: string): Promise<void> {
  const res = await authedFetch(`/api/songs/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete song");
}

export function useSongs() {
  return useQuery({
    queryKey: SONGS_KEY,
    queryFn: () => fetchSongs(),
    staleTime: 30_000,
  });
}

export function useAuthors() {
  return useQuery({
    queryKey: AUTHORS_KEY,
    queryFn: fetchAuthors,
    staleTime: 60_000,
  });
}

export function useUpdateSong() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateSong(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: SONGS_KEY });
      const previous = queryClient.getQueryData<Song[]>(SONGS_KEY);
      if (previous) {
        queryClient.setQueryData<Song[]>(SONGS_KEY, (old) =>
          old?.map((s) => (s.id === id ? { ...s, ...data } : s))
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SONGS_KEY, context.previous);
      }
      toast.error("Failed to save song");
    },
    onSuccess: () => {
      toast.success("Song saved");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SONGS_KEY });
      router.refresh();
    },
  });
}

export function useDeleteSong() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (id: string) => deleteSong(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: SONGS_KEY });
      const previous = queryClient.getQueryData<Song[]>(SONGS_KEY);
      if (previous) {
        queryClient.setQueryData<Song[]>(SONGS_KEY, (old) =>
          old?.filter((s) => s.id !== id)
        );
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SONGS_KEY, context.previous);
      }
      toast.error("Failed to delete song");
    },
    onSuccess: () => {
      toast.success("Song deleted");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SONGS_KEY });
      router.refresh();
    },
  });
}
