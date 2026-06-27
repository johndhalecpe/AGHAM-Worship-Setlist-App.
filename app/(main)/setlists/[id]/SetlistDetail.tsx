"use client";

import { useState, useCallback } from "react";
import SetlistContent from "@/components/setlists/SetlistContent";
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
  const [copied, setCopied] = useState(false);

  const toggleLock = useCallback(() => {
    setIsLocked((prev) => {
      const next = !prev;
      localStorage.setItem("setlist-lock-" + id, String(next));
      return next;
    });
  }, [id]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <SetlistContent
      initialSetlist={initialSetlist}
      initialSections={initialSections}
      isPast={isPast}
      isLocked={isLocked}
      copied={copied}
      onCopyLink={handleCopyLink}
      onToggleLock={toggleLock}
    />
  );
}
