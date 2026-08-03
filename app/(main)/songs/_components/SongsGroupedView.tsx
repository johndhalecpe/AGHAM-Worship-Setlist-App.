"use client";

import { useState, useMemo, useCallback, useDeferredValue } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { SongListItem } from "@/lib/type";
import { useIsGuest } from "@/lib/hooks/useIsGuest";
import { useUpdateSong } from "@/lib/hooks/use-songs";
import { useRealtimeSongs } from "@/lib/hooks/use-realtime-setlist";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import SongCard from "@/components/songs/SongCard";
import SongsSearchBar from "./SongsSearchBar";
import EditSongModal from "./EditSongModal";

const TABS = ["all", "worship", "praise", "other", "draft"] as const;
const TAB_LABELS: Record<string, string> = {
  all: "All",
  worship: "Worship",
  praise: "Praise",
  other: "Other",
  draft: "Draft",
};
const CATEGORY_LABELS: Record<string, string> = {
  worship: "Worship",
  praise: "Praise",
  other: "Other",
};
const LANGUAGE_LABELS: Record<string, string> = {
  english: "English",
  filipino: "Filipino",
};
const SORTED_LANGUAGES = ["english", "filipino"];

type LanguageGroup = {
  category: "worship" | "praise";
  songs: Record<string, SongListItem[]>;
};

type Group = LanguageGroup | { category: "other"; songs: SongListItem[] };

function groupSongsByCategoryAndLanguage(songs: SongListItem[]): Group[] {
  const groups: Group[] = [];

  for (const category of ["worship", "praise"] as const) {
    const songsByLanguage: Record<string, SongListItem[]> = {};
    for (const song of songs) {
      if (song.category === category && song.language) {
        if (!songsByLanguage[song.language]) songsByLanguage[song.language] = [];
        songsByLanguage[song.language].push(song);
      }
    }
    if (Object.keys(songsByLanguage).length > 0) {
      groups.push({ category, songs: songsByLanguage });
    }
  }

  const otherSongs = songs.filter(
    (s) => s.category !== "worship" && s.category !== "praise" && s.category !== null
  );
  if (otherSongs.length > 0) {
    groups.push({ category: "other", songs: otherSongs });
  }

  return groups;
}

const LANGUAGE_FILTERS = ["english", "filipino"] as const;
const TIME_SIG_FILTERS = ["4/4", "3/4", "6/8"] as const;

export default function SongsGroupedView({ songs }: { songs: SongListItem[] }) {
  const [isLocked, setIsLocked] = useState(true);
  const isGuest = useIsGuest();
  const effectivelyLocked = isLocked || isGuest;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bannerExpanded, setBannerExpanded] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(new Set());
  const [selectedTimeSigs, setSelectedTimeSigs] = useState<Set<string>>(new Set());
  const [composedOnly, setComposedOnly] = useState(false);
  const [expandedLanguages, setExpandedLanguages] = usePersistentState<string[]>(
    "song-library:expanded-languages",
    []
  );

  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category");
  const activeTab =
    urlCategory && urlCategory !== "all" && (TABS as readonly string[]).includes(urlCategory)
      ? urlCategory
      : "all";

  useRealtimeSongs();

  const deferredSearch = useDeferredValue(searchQuery);

  const searchMatches = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) return null;
    const title: SongListItem[] = [];
    const author: SongListItem[] = [];
    for (const song of songs) {
      const lowerTitle = song.title.toLowerCase();
      const lowerAuthor = (song.author ?? "").toLowerCase();
      if (lowerTitle.includes(query)) {
        title.push(song);
      } else if (lowerAuthor.includes(query)) {
        author.push(song);
      }
    }
    return { title, author };
  }, [songs, deferredSearch]);

  const filteredSongs = useMemo(() => {
    let result = songs;

    if (activeTab === "draft") {
      result = result.filter((s) => s.status === "draft");
    } else if (activeTab === "worship" || activeTab === "praise") {
      result = result.filter((s) => s.category === activeTab);
    } else if (activeTab === "other") {
      result = result.filter((s) => s.category !== "worship" && s.category !== "praise");
    }

    if (composedOnly) {
      result = result.filter((s) => (s.author ?? "").toLowerCase() === "kenneth acebuche");
    }

    if (selectedLanguages.size > 0) {
      result = result.filter((s) => s.language && selectedLanguages.has(s.language));
    }

    if (selectedTimeSigs.size > 0) {
      result = result.filter((s) => s.default_time_signature && selectedTimeSigs.has(s.default_time_signature));
    }

    return result;
  }, [songs, activeTab, composedOnly, selectedLanguages, selectedTimeSigs]);


  const hasSearch = searchMatches !== null;
  const groups = hasSearch ? [] : groupSongsByCategoryAndLanguage(filteredSongs);

  const toggleLanguage = useCallback((lang: string) => {
    setSelectedLanguages((prev) => {
      const next = new Set(prev);
      if (next.has(lang)) next.delete(lang);
      else next.add(lang);
      return next;
    });
  }, []);

  const toggleTimeSig = useCallback((ts: string) => {
    setSelectedTimeSigs((prev) => {
      const next = new Set(prev);
      if (next.has(ts)) next.delete(ts);
      else next.add(ts);
      return next;
    });
  }, []);

  const handleTabClick = useCallback(
    (tab: string) => {
      const next = tab === activeTab ? "all" : tab;
      router.replace(next === "all" ? "/songs" : `/songs?category=${next}`, { scroll: false });
    },
    [activeTab, router]
  );

  const isLanguageSectionExpanded = useCallback(
    (key: string) => expandedLanguages.includes(key),
    [expandedLanguages]
  );

  const toggleLanguageSection = useCallback(
    (key: string) => {
      setExpandedLanguages((prev) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
      );
    },
    [setExpandedLanguages]
  );

  const clearFilters = useCallback(() => {
    setSelectedLanguages(new Set());
    setSelectedTimeSigs(new Set());
    setComposedOnly(false);
    setShowFilters(false);
    router.replace("/songs", { scroll: false });
  }, [router]);

  const updateSong = useUpdateSong();

  function handleSave(songId: string, data: {
    title: string;
    author: string;
    category: string;
    language: string;
    default_key: string;
    default_bpm: number | null;
    default_time_signature: string;
    lyrics: string;
    chords: string;
  }) {
    updateSong.mutate(
      { id: songId, data: data as Record<string, unknown> },
      {
        onSuccess: () => {
          setEditingId(null);
        },
      }
    );
  }

  const hasActiveFilters = activeTab !== "all" || composedOnly || selectedLanguages.size > 0 || selectedTimeSigs.size > 0;

  return (
    <div className="flex flex-col gap-6">
      <div
        className="rounded-xl"
        style={{
          backgroundColor: "var(--color-surface-muted)",
          border: "1px solid var(--color-border)",
        }}
      >
        <button
          onClick={() => setBannerExpanded(!bannerExpanded)}
          aria-expanded={bannerExpanded}
          className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 min-h-[44px] text-left transition-colors hover:opacity-90"
        >
          {effectivelyLocked ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0" style={{ color: "var(--color-text-tertiary)" }}>
              <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0" style={{ color: "var(--color-accent)" }}>
              <path fillRule="evenodd" d="M14.5 1A4.5 4.5 0 0 0 10 5.5V9H3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 14.5 1Zm-3 8V5.5a3 3 0 1 1 6 0V9h-6Z" clipRule="evenodd" />
            </svg>
          )}
          <span className="flex-1 min-w-0 text-sm font-medium" style={{ color: "var(--color-text)" }}>
            {effectivelyLocked ? "Library locked" : "Library unlocked"}
          </span>
          <span className="text-xs shrink-0" style={{ color: "var(--color-text-tertiary)" }}>
            {effectivelyLocked ? "Unlock to edit or delete songs" : "Lock to prevent accidental changes"}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-4 h-4 shrink-0 transition-transform ${bannerExpanded ? "rotate-180" : ""}`}
            style={{ color: "var(--color-text-tertiary)" }}
          >
            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </button>
        {bannerExpanded && (
          <div
            className="px-3 sm:px-4 py-3 flex flex-wrap items-center gap-2"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <p className="w-full text-xs mb-1" style={{ color: "var(--color-text-tertiary)" }}>
              {effectivelyLocked ? "The song library is locked to prevent accidental changes. Unlock to edit or delete songs." : "The song library is unlocked. Lock it to prevent accidental changes."}
            </p>
            <Link
              href={isGuest ? "#" : "/songs/new"}
              onClick={(e) => {
                if (isGuest) {
                  e.preventDefault();
                  toast.error("Guests can't edit lineups");
                }
              }}
              className="rounded-lg px-3 py-2 text-sm font-medium transition-all hover:-translate-y-0.5 min-h-[44px] flex items-center"
              style={{
                backgroundColor: "var(--color-accent)",
                color: "var(--color-text-on-accent)",
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
              </svg>
              Add a song
            </Link>
            <button
              onClick={() => {
                if (isGuest) {
                  toast.error("Guests can't edit lineups");
                  return;
                }
                setIsLocked(!isLocked);
              }}
              className="rounded-lg px-3 py-2 text-sm font-medium transition-all hover:-translate-y-0.5 min-h-[44px]"
              style={{
                backgroundColor: isLocked ? "var(--color-accent)" : "var(--color-surface-card)",
                color: isLocked ? "#fff" : "var(--color-text-secondary)",
                border: isLocked ? "none" : "1px solid var(--color-border)",
              }}
            >
              {isLocked ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1 inline-block align-text-bottom">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                  </svg>
                  Unlock
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1 inline-block align-text-bottom">
                    <path fillRule="evenodd" d="M14.5 1A4.5 4.5 0 0 0 10 5.5V9H3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 14.5 1Zm-3 8V5.5a3 3 0 1 1 6 0V9h-6Z" clipRule="evenodd" />
                  </svg>
                  Lock
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <SongsSearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="rounded-lg px-3 py-2 text-sm font-medium transition-all shrink-0 min-h-[44px] flex items-center gap-1.5"
          style={{
            backgroundColor: showFilters || hasActiveFilters ? "var(--color-accent)" : "var(--color-surface-card)",
            color: showFilters || hasActiveFilters ? "#fff" : "var(--color-text-secondary)",
            border: showFilters || hasActiveFilters ? "none" : "1px solid var(--color-border)",
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74Z" clipRule="evenodd" />
          </svg>
          {hasActiveFilters && (
            <span className="text-xs bg-white/20 rounded-full px-1.5 py-0.5">
              {[activeTab !== "all" ? TAB_LABELS[activeTab] : null, ...(selectedLanguages.size > 0 ? ["Lang"] : []), ...(selectedTimeSigs.size > 0 ? ["Time"] : [])].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      <div
        className="sticky top-14 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 flex gap-1.5 overflow-x-auto"
        style={{ backgroundColor: "var(--color-surface)", scrollbarWidth: "none" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            aria-pressed={activeTab === tab}
            className="rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors min-h-[40px]"
            style={{
              backgroundColor: activeTab === tab ? "var(--color-accent)" : "var(--color-surface-card)",
              color: activeTab === tab ? "#fff" : "var(--color-text-secondary)",
              border: activeTab === tab ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
            }}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {showFilters && (
        <div
          className="rounded-xl p-3 flex flex-col gap-2 relative"
          style={{
            backgroundColor: "var(--color-surface-muted)",
            border: "1px solid var(--color-border)",
          }}
        >
          <button
            onClick={() => setShowFilters(false)}
            className="absolute top-2 right-2 p-0.5 rounded transition-colors hover:opacity-80"
            style={{ color: "var(--color-text-tertiary)" }}
            aria-label="Close filters"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>

          <div>
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>
              Language
            </span>
            <div className="flex gap-1.5 mt-1">
              {LANGUAGE_FILTERS.map((lang) => (
                <button
                  key={lang}
                  onClick={() => toggleLanguage(lang)}
                  className="rounded-lg px-2.5 py-1 text-xs font-medium transition-all"
                  style={{
                    backgroundColor: selectedLanguages.has(lang) ? "var(--color-accent)" : "var(--color-surface-card)",
                    color: selectedLanguages.has(lang) ? "#fff" : "var(--color-text-secondary)",
                    border: selectedLanguages.has(lang) ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                  }}
                >
                  {LANGUAGE_LABELS[lang]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>
              Author
            </span>
            <div className="flex gap-1.5 mt-1">
              <button
                onClick={() => setComposedOnly(!composedOnly)}
                className="rounded-lg px-2.5 py-1 text-xs font-medium transition-all"
                style={{
                  backgroundColor: composedOnly ? "var(--color-accent)" : "var(--color-surface-card)",
                  color: composedOnly ? "#fff" : "var(--color-text-secondary)",
                  border: composedOnly ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                }}
              >
                Composed
              </button>
            </div>
          </div>

          <div>
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>
              Time Signature
            </span>
            <div className="flex gap-1.5 mt-1">
              {TIME_SIG_FILTERS.map((ts) => (
                <button
                  key={ts}
                  onClick={() => toggleTimeSig(ts)}
                  className="rounded-lg px-2.5 py-1 text-xs font-medium transition-all"
                  style={{
                    backgroundColor: selectedTimeSigs.has(ts) ? "var(--color-accent)" : "var(--color-surface-card)",
                    color: selectedTimeSigs.has(ts) ? "#fff" : "var(--color-text-secondary)",
                    border: selectedTimeSigs.has(ts) ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                  }}
                >
                  {ts}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-medium self-start rounded-lg px-2.5 py-1 transition-colors"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {!hasSearch && hasActiveFilters && (
        <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
          {filteredSongs.length} song{filteredSongs.length !== 1 ? "s" : ""}
          {activeTab !== "all" ? ` in ${TAB_LABELS[activeTab] ?? activeTab}` : ""}
          {selectedLanguages.size > 0 ? ` (${[...selectedLanguages].map((l) => LANGUAGE_LABELS[l]).join(", ")})` : ""}
          {selectedTimeSigs.size > 0 ? ` (${[...selectedTimeSigs].join(", ")} time)` : ""}
        </p>
      )}

      {hasSearch ? (
        <>
          {searchMatches.title.length > 0 && (
            <div>
              <h3 className="text-base font-bold mb-3" style={{ color: "var(--color-text)" }}>
                Found a song match
              </h3>
              <div className="flex flex-col gap-0.5">
                {searchMatches.title.map((song) => (
                  <SongCard key={song.id} song={song} isLocked={effectivelyLocked} onEditRequest={(id) => setEditingId(id)} />
                ))}
              </div>
            </div>
          )}
          {searchMatches.author.length > 0 && (
            <div>
              <h3 className="text-base font-bold mb-3" style={{ color: "var(--color-text)" }}>
                Found an author match
              </h3>
              <div className="flex flex-col gap-0.5">
                {searchMatches.author.map((song) => (
                  <SongCard key={song.id} song={song} isLocked={effectivelyLocked} onEditRequest={(id) => setEditingId(id)} />
                ))}
              </div>
            </div>
          )}
          {searchMatches.title.length + searchMatches.author.length === 0 && (
            <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
              No songs match your search.
            </p>
          )}
        </>
      ) : activeTab === "draft" ? (
        <>
          {filteredSongs.length > 0 ? (
            <div className="flex flex-col gap-0.5">
              {filteredSongs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  isLocked={effectivelyLocked}
                  onEditRequest={(id) => setEditingId(id)}
                  showMissingTags
                />
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
              No draft songs.
            </p>
          )}
        </>
      ) : (
        <>
          {groups.map((group) => (
            <div key={group.category}>
              <h3 className="text-base font-bold mb-3" style={{ color: "var(--color-text)" }}>
                {CATEGORY_LABELS[group.category] ?? group.category}
              </h3>
              {group.category === "other" ? (
                <div className="flex flex-col gap-0.5">
                  {group.songs.map((song) => (
                    <SongCard key={song.id} song={song} isLocked={effectivelyLocked} onEditRequest={(id) => setEditingId(id)} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {SORTED_LANGUAGES
                    .filter((lang) => group.songs[lang])
                    .map((lang) => {
                      const sectionKey = `${group.category}-${lang}`;
                      const expanded = isLanguageSectionExpanded(sectionKey);
                      const sectionSongs = group.songs[lang];
                      const visibleSongs = expanded ? sectionSongs : sectionSongs.slice(0, 5);
                      return (
                        <div key={lang}>
                          <div className="flex items-center gap-1.5 min-h-[44px] sm:min-h-[36px]">
                            <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--color-text-tertiary)" }}>
                              {LANGUAGE_LABELS[lang] ?? lang}
                            </span>
                            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                              ({sectionSongs.length})
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            {visibleSongs.map((song) => (
                              <SongCard key={song.id} song={song} isLocked={effectivelyLocked} onEditRequest={(id) => setEditingId(id)} />
                            ))}
                          </div>
                          {sectionSongs.length > 5 && (
                            <button
                              onClick={() => toggleLanguageSection(sectionKey)}
                              aria-expanded={expanded}
                              className="mt-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors hover:opacity-80 min-h-[40px]"
                              style={{
                                color: "var(--color-accent)",
                                backgroundColor: "color-mix(in srgb, var(--color-accent) 8%, transparent)",
                              }}
                            >
                              {expanded ? "Show less" : `Show all (${sectionSongs.length})`}
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          ))}
          {groups.length === 0 && (
            <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
              {activeTab === "all"
                ? "No songs yet. Add one above."
                : `No ${TAB_LABELS[activeTab] ?? "songs"} songs yet.`}
            </p>
          )}
        </>
      )}

      {editingId && (
        <EditSongModal
          songId={editingId}
          onSave={(data) => handleSave(editingId, data)}
          onCancel={() => setEditingId(null)}
          isSaving={updateSong.isPending}
        />
      )}
    </div>
  );
}