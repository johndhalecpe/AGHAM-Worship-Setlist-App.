"use client";

import { useState, useCallback } from "react";
import SetlistContent from "@/components/setlists/setlist-detail/SetlistContent";
import { Setlist, SetlistSectionWithSong } from "@/lib/type";

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
  const [isLocked, setIsLocked] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("setlist-lock-" + id);
    return stored !== null ? stored === "true" : true;
  });

  const toggleLock = useCallback(() => {
    setIsLocked((prev) => {
      const next = !prev;
      localStorage.setItem("setlist-lock-" + id, String(next));
      return next;
    });
  }, [id]);

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
