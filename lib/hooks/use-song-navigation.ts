"use client";

import { useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Song } from "@/lib/type";

/** Module-level in-memory session cache of prefetched songs (id -> full song incl. chords). */
export const SONG_NAV_PREFETCH_CACHE = new Map<string, Song>();

/** Minimal song shape the nav needs (id for URL matching, title for the bar labels). */
export type NavSong = Pick<Song, "id" | "title">;

export interface UseSongNavigationReturn {
  currentSong: NavSong | null;
  currentIndex: number;
  prevSong: NavSong | null;
  nextSong: NavSong | null;
  hasPrevious: boolean;
  hasNext: boolean;
  goPrevious(): void;
  goNext(): void;
}

/**
 * URL-driven song navigation. The `?song=<songId>` query param is the single
 * source of truth; `currentIndex`, `prevSong`, `nextSong` and the boundary
 * flags are derived from it + the ordered array on every render — never stored
 * in state. Next/Previous only update the URL param (`replace`, no scroll).
 *
 * NOTE: `useSearchParams` requires a Suspense boundary — callers must render
 * this hook inside one (see SongsGroupedView for the established pattern).
 */
export function useSongNavigation(
  orderedSongs: NavSong[],
  initialSongId?: string | null
): UseSongNavigationReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const songParam = searchParams.get("song");

  const currentSongId = songParam ?? initialSongId ?? orderedSongs[0]?.id ?? null;

  // Seed the URL once when no ?song= param is present.
  useEffect(() => {
    if (songParam === null && currentSongId !== null) {
      router.replace(`?song=${currentSongId}`, { scroll: false });
    }
  }, [songParam, currentSongId, router]);

  const matchIndex = orderedSongs.findIndex((s) => s.id === currentSongId);
  const currentIndex = matchIndex === -1 ? 0 : matchIndex;
  const currentSong = orderedSongs[currentIndex] ?? null;
  const prevSong = currentIndex > 0 ? orderedSongs[currentIndex - 1] : null;
  const nextSong =
    currentIndex < orderedSongs.length - 1 ? orderedSongs[currentIndex + 1] : null;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < orderedSongs.length - 1;

  // Invalid ?song= id: fall back to the first song and rewrite the URL.
  useEffect(() => {
    if (songParam !== null && matchIndex === -1 && orderedSongs.length > 0) {
      router.replace(`?song=${orderedSongs[0].id}`, { scroll: false });
    }
  }, [songParam, matchIndex, orderedSongs, router]);

  const goPrevious = useCallback(() => {
    if (prevSong) {
      router.replace(`?song=${prevSong.id}`, { scroll: false });
    }
  }, [prevSong, router]);

  const goNext = useCallback(() => {
    if (nextSong) {
      router.replace(`?song=${nextSong.id}`, { scroll: false });
    }
  }, [nextSong, router]);

  return {
    currentSong,
    currentIndex,
    prevSong,
    nextSong,
    hasPrevious,
    hasNext,
    goPrevious,
    goNext,
  };
}