"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getPendingProfiles } from "@/lib/services/profileService";

const POLL_INTERVAL_MS = 30000;

export function useNewUserNotification(isAdmin: boolean) {
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isAdmin) return;

    let interval: ReturnType<typeof setInterval>;

    function startPolling() {
      interval = setInterval(async () => {
        const profiles = await getPendingProfiles();

        for (const profile of profiles) {
          if (notifiedIdsRef.current.has(profile.id)) continue;
          notifiedIdsRef.current.add(profile.id);

          toast.success(`${profile.name} signed up!`);
        }
      }, POLL_INTERVAL_MS);
    }

    function stopPolling() {
      if (interval) clearInterval(interval);
    }

    getPendingProfiles().then((profiles) => {
      for (const p of profiles) {
        notifiedIdsRef.current.add(p.id);
      }
    });

    startPolling();

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopPolling();
      else startPolling();
    });

    return () => {
      stopPolling();
    };
  }, [isAdmin]);
}
