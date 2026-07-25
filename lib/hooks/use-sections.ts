"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { SetlistSectionWithSong } from "@/lib/type";

function sectionsKey(setlistId: string) {
  return ["setlists", setlistId, "sections"] as const;
}

async function addSection(
  setlistId: string,
  sectionType: string,
  songId: string
): Promise<SetlistSectionWithSong> {
  const res = await fetch(`/api/setlists/${setlistId}/sections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ song_id: songId, section_type: sectionType }),
  });
  if (!res.ok) throw new Error("Failed to add song");
  return res.json();
}

async function removeSection(setlistId: string, sectionId: string): Promise<void> {
  const res = await fetch(
    `/api/setlists/${setlistId}/sections?sectionId=${sectionId}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error("Failed to remove song");
}

async function updateSections(
  setlistId: string,
  items: Record<string, unknown>[]
): Promise<void> {
  const res = await fetch(`/api/setlists/${setlistId}/sections`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error("Failed to update sections");
}

export function useAddSection(setlistId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sectionType,
      songId,
    }: {
      sectionType: string;
      songId: string;
    }) => addSection(setlistId, sectionType, songId),
    onError: () => {
      toast.error("Failed to add song to lineup");
    },
    onSuccess: (newSection) => {
      queryClient.setQueryData<SetlistSectionWithSong[]>(
        sectionsKey(setlistId),
        (old) => [...(old ?? []), newSection]
      );
      toast.success("Song added to lineup");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["setlists"] });
    },
  });
}

export function useRemoveSection(setlistId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sectionId: string) => removeSection(setlistId, sectionId),
    onMutate: async (sectionId) => {
      await queryClient.cancelQueries({ queryKey: sectionsKey(setlistId) });
      const previous = queryClient.getQueryData<SetlistSectionWithSong[]>(
        sectionsKey(setlistId)
      );
      if (previous) {
        queryClient.setQueryData<SetlistSectionWithSong[]>(
          sectionsKey(setlistId),
          (old) => old?.filter((s) => s.id !== sectionId)
        );
      }
      return { previous };
    },
    onError: (_err, _sectionId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(sectionsKey(setlistId), context.previous);
      }
      toast.error("Failed to remove song");
    },
    onSuccess: () => {
      toast.success("Song removed from lineup");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: sectionsKey(setlistId) });
      queryClient.invalidateQueries({ queryKey: ["setlists"] });
    },
  });
}

export function useUpdateSections(setlistId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: Record<string, unknown>[]) =>
      updateSections(setlistId, items),
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: sectionsKey(setlistId) });
      const previous = queryClient.getQueryData<SetlistSectionWithSong[]>(
        sectionsKey(setlistId)
      );
      if (previous) {
        const updated = previous.map((s) => {
          const update = items.find((i) => i.id === s.id);
          return update
            ? { ...s, ...update, songs: s.songs }
            : s;
        });
        queryClient.setQueryData(sectionsKey(setlistId), updated);
      }
      return { previous };
    },
    onError: (_err, _items, context) => {
      if (context?.previous) {
        queryClient.setQueryData(sectionsKey(setlistId), context.previous);
      }
      toast.error("Failed to update sections");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: sectionsKey(setlistId) });
      queryClient.invalidateQueries({ queryKey: ["setlists"] });
    },
  });
}
