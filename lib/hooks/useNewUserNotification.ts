"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { getPendingProfiles } from "@/lib/services/profileService";

export function useNewUserNotification(isAdmin: boolean, onRefresh?: () => void) {
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isAdmin) return;

    getPendingProfiles().then((profiles) => {
      for (const p of profiles) {
        notifiedIdsRef.current.add(p.id);
      }
    });

    function handleInsert(payload: { new: { id: string; name: string } }) {
      const profile = payload.new;
      if (!notifiedIdsRef.current.has(profile.id)) {
        notifiedIdsRef.current.add(profile.id);
        toast.success(`${profile.name} signed up!`);
        onRefresh?.();
      }
    }

    const channel = supabase
      .channel("pending-profiles")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "profiles",
          filter: "status=eq.pending",
        },
        handleInsert,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, onRefresh]);
}
