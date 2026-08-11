"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimePostgresChangesPayload, RealtimePostgresUpdatePayload } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getLastLocalWriteTs, isRealtimeEditing } from "@/lib/realtime-editing";
import type { SetlistSectionWithSong, SetlistWithSections, Song } from "@/lib/type";

const UPDATE_BUFFER_MS = 20_000;

type UpdateBuffer = {
  latest: RealtimePostgresUpdatePayload<Record<string, unknown>> | null;
  timer: ReturnType<typeof setTimeout> | null;
};

function pick<T extends object>(
  record: Record<string, unknown>,
  keys: readonly (keyof T)[]
): Partial<T> {
  const out: Partial<T> = {};
  for (const key of keys) {
    if (key in record) {
      out[key] = record[key as string] as T[keyof T];
    }
  }
  return out;
}

const SONG_PATCH_KEYS = [
  "title",
  "author",
  "category",
  "language",
  "default_key",
  "default_bpm",
  "default_time_signature",
  "status",
] as const;

const SECTION_PATCH_KEYS = [
  "song_id",
  "section_type",
  "sort_order",
  "notes",
  "song_key",
] as const;

function patchSong(song: Song, record: Record<string, unknown>): Song {
  return { ...song, ...pick<Song>(record, SONG_PATCH_KEYS) };
}

function patchSection(
  sec: SetlistSectionWithSong,
  record: Record<string, unknown>
): SetlistSectionWithSong {
  return { ...sec, ...pick<SetlistSectionWithSong>(record, SECTION_PATCH_KEYS) };
}

export function useRealtimeSections(setlistId: string | undefined) {
  const queryClient = useQueryClient();
  const buffer = useRef<UpdateBuffer>({ latest: null, timer: null });

  useEffect(() => {
    if (!setlistId) return;

    const buf = buffer.current;

    const armTimer = () => {
      if (buf.timer) clearTimeout(buf.timer);
      buffer.current.timer = setTimeout(() => {
        buffer.current.timer = null;
        if (isRealtimeEditing("setlist_sections")) {
          armTimer();
          return;
        }
        const payload = buf.latest;
        buf.latest = null;
        if (!payload) return;
        if (Date.parse(payload.commit_timestamp) <= getLastLocalWriteTs("setlist_sections")) {
          return;
        }
        const record = payload.new;
        queryClient.setQueryData<SetlistSectionWithSong[]>(
          ["setlists", setlistId, "sections"],
          (old) => old?.map((sec) => (sec.id === record.id ? patchSection(sec, record) : sec))
        );
        queryClient.setQueryData<SetlistWithSections[]>(["setlists"], (old) =>
          old?.map((setlist) =>
            setlist.id === setlistId
              ? {
                  ...setlist,
                  sections: setlist.sections.map((sec) =>
                    sec.id === record.id ? patchSection(sec, record) : sec
                  ),
                }
              : setlist
          )
        );
      }, UPDATE_BUFFER_MS);
    };

    const channel = supabase
      .channel(`sections:${setlistId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "setlist_sections",
          filter: `setlist_id=eq.${setlistId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (payload.eventType === "INSERT" || payload.eventType === "DELETE") {
            queryClient.invalidateQueries({ queryKey: ["setlists", setlistId, "sections"] });
            queryClient.invalidateQueries({ queryKey: ["setlists"] });
            return;
          }
          if (payload.eventType === "UPDATE") {
            buf.latest = payload;
            armTimer();
          }
        }
      )
      .subscribe();

    return () => {
      if (buf.timer) clearTimeout(buf.timer);
      buf.latest = null;
      supabase.removeChannel(channel);
    };
  }, [setlistId, queryClient]);
}

export function useRealtimeSongs() {
  const queryClient = useQueryClient();
  const buffer = useRef<UpdateBuffer>({ latest: null, timer: null });

  useEffect(() => {
    const buf = buffer.current;

    const armTimer = () => {
      if (buf.timer) clearTimeout(buf.timer);
      buffer.current.timer = setTimeout(() => {
        buffer.current.timer = null;
        if (isRealtimeEditing("songs")) {
          armTimer();
          return;
        }
        const payload = buf.latest;
        buf.latest = null;
        if (!payload) return;
        if (Date.parse(payload.commit_timestamp) <= getLastLocalWriteTs("songs")) {
          return;
        }
        const record = payload.new;
        queryClient.setQueryData<Song[]>(["songs"], (old) =>
          old?.map((song) => (song.id === record.id ? patchSong(song, record) : song))
        );
      }, UPDATE_BUFFER_MS);
    };

    const channel = supabase
      .channel("songs:all")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "songs",
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (payload.eventType === "INSERT" || payload.eventType === "DELETE") {
            queryClient.invalidateQueries({ queryKey: ["songs"] });
            return;
          }
          if (payload.eventType === "UPDATE") {
            buf.latest = payload;
            armTimer();
          }
        }
      )
      .subscribe();

    return () => {
      if (buf.timer) clearTimeout(buf.timer);
      buf.latest = null;
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}