"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useRealtimeSections(setlistId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!setlistId) return;

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
        () => {
          queryClient.invalidateQueries({
            queryKey: ["setlists", setlistId, "sections"],
          });
          queryClient.invalidateQueries({ queryKey: ["setlists"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setlistId, queryClient]);
}

export function useRealtimeSongs() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("songs:all")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "songs",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["songs"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
