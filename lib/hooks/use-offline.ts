"use client";

import { useState, useEffect } from "react";

/**
 * Hook that tracks online/offline status.
 * Returns true when the browser is online, false when offline.
 * Updates reactively when network status changes.
 */
export function useOffline(): boolean {
  const [isOffline, setIsOffline] = useState(() => {
    if (typeof navigator === "undefined") return false;
    return !navigator.onLine;
  });

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Sync on mount in case state drifted
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOffline;
}
