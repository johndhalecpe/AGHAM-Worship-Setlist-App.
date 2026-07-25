"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Setlist, SetlistWithSections } from "@/lib/type";

const SETLISTS_KEY = ["setlists"] as const;

function setlistKey(id: string) {
  return ["setlists", id] as const;
}

async function fetchSetlists(): Promise<SetlistWithSections[]> {
  const res = await fetch("/api/setlists");
  if (!res.ok) throw new Error("Failed to fetch setlists");
  return res.json();
}

async function fetchSetlist(id: string): Promise<Setlist> {
  const res = await fetch(`/api/setlists/${id}`);
  if (!res.ok) throw new Error("Failed to fetch setlist");
  return res.json();
}

async function updateSetlist(id: string, data: Record<string, unknown>): Promise<Setlist> {
  const res = await fetch(`/api/setlists/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update setlist");
  return res.json();
}

async function deleteSetlist(id: string): Promise<void> {
  const res = await fetch(`/api/setlists/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete setlist");
}

export function useSetlists() {
  return useQuery({
    queryKey: SETLISTS_KEY,
    queryFn: fetchSetlists,
    staleTime: 30_000,
  });
}

export function useSetlist(id: string | undefined) {
  return useQuery({
    queryKey: setlistKey(id ?? ""),
    queryFn: () => fetchSetlist(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useUpdateSetlist() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateSetlist(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: setlistKey(id) });
      const previous = queryClient.getQueryData<Setlist>(setlistKey(id));
      if (previous) {
        queryClient.setQueryData<Setlist>(setlistKey(id), (old) =>
          old ? { ...old, ...data } : old
        );
      }
      return { previous, id };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(setlistKey(context.id), context.previous);
      }
      toast.error("Failed to save lineup");
    },
    onSuccess: () => {
      toast.success("Lineup saved");
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: SETLISTS_KEY });
      queryClient.invalidateQueries({ queryKey: setlistKey(vars.id) });
      router.refresh();
    },
  });
}

export function useDeleteSetlist() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (id: string) => deleteSetlist(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: SETLISTS_KEY });
      const previous = queryClient.getQueryData<SetlistWithSections[]>(SETLISTS_KEY);
      if (previous) {
        queryClient.setQueryData<SetlistWithSections[]>(SETLISTS_KEY, (old) =>
          old?.filter((s) => s.id !== id)
        );
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SETLISTS_KEY, context.previous);
      }
      toast.error("Failed to delete lineup");
    },
    onSuccess: () => {
      toast.success("Lineup deleted");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SETLISTS_KEY });
      router.refresh();
    },
  });
}
