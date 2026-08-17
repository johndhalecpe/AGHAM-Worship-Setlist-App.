"use client";

import { useOffline } from "@/lib/hooks/use-offline";

/**
 * Subtle pill indicator shown in the header when the user is offline.
 * Only renders when offline — invisible when online.
 */
export default function OfflineIndicator() {
  const isOffline = useOffline();

  if (!isOffline) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0"
      style={{
        backgroundColor: "color-mix(in srgb, var(--color-accent-secondary) 15%, transparent)",
        color: "var(--color-accent-secondary)",
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--color-accent-secondary)" }} />
      Offline
    </span>
  );
}
