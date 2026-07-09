"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import SetlistContent from "@/components/setlists/setlist-detail/SetlistContent";
import { Setlist, SetlistSectionWithSong } from "@/lib/type";
import { useIsGuest } from "@/lib/hooks/useIsGuest";

type SetlistDetailProps = {
  id: string;
  initialSetlist: Setlist;
  initialSections: SetlistSectionWithSong[];
  isPast: boolean;
};

export default function SetlistDetail({
  id,
  initialSetlist,
  initialSections,
  isPast,
}: SetlistDetailProps) {
  const isGuest = useIsGuest();
  const [isLocked, setIsLocked] = useState(isPast || isGuest);

  useEffect(() => {
    if (isPast) return;
    const stored = localStorage.getItem("setlist-lock-" + id);
    if (stored !== null) {
      setIsLocked(stored === "true");
    }
  }, [id, isPast]);

  useEffect(() => {
    if (isGuest) setIsLocked(true);
  }, [isGuest]);

  const toggleLock = useCallback(() => {
    if (isGuest) {
      toast.error("Guests can only view — sign in to make changes");
      return;
    }
    setIsLocked((prev) => {
      const next = !prev;
      localStorage.setItem("setlist-lock-" + id, String(next));
      return next;
    });
  }, [id, isGuest]);

  return (
    <SetlistContent
      initialSetlist={initialSetlist}
      initialSections={initialSections}
      isPast={isPast}
      isLocked={isLocked}
      onToggleLock={toggleLock}
    />
  );
}
