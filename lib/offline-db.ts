/**
 * IndexedDB wrapper for offline song/lyrics/chords caching.
 *
 * Stores:
 *   - songs:      Full song records keyed by id
 *   - setlists:   Setlist records with sections keyed by id
 *   - api-cache:  Generic API response cache keyed by request URL
 *
 * All operations are no-ops when IndexedDB is unavailable (SSR, old browsers).
 */

const DB_NAME = "agham-setlist-offline";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("songs")) {
        db.createObjectStore("songs", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("setlists")) {
        db.createObjectStore("setlists", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("api-cache")) {
        db.createObjectStore("api-cache", { keyPath: "url" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

async function txGet<T>(store: string, key: string): Promise<T | undefined> {
  try {
    const db = await openDB();
    return await new Promise<T | undefined>((resolve, reject) => {
      const txn = db.transaction(store, "readonly");
      const req = txn.objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return undefined;
  }
}

async function txGetAll<T>(store: string): Promise<T[]> {
  try {
    const db = await openDB();
    return await new Promise<T[]>((resolve, reject) => {
      const txn = db.transaction(store, "readonly");
      const req = txn.objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

async function txPut<T>(store: string, value: T): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const txn = db.transaction(store, "readwrite");
      txn.objectStore(store).put(value);
      txn.oncomplete = () => resolve();
      txn.onerror = () => reject(txn.error);
    });
  } catch {
    // Silently fail — offline caching is best-effort
  }
}

async function txDelete(store: string, key: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const txn = db.transaction(store, "readwrite");
      txn.objectStore(store).delete(key);
      txn.oncomplete = () => resolve();
      txn.onerror = () => reject(txn.error);
    });
  } catch {
    // Silently fail
  }
}

// ---------------------------------------------------------------------------
// Songs
// ---------------------------------------------------------------------------

export interface CachedSong {
  id: string;
  title: string;
  author: string | null;
  category: string | null;
  language: string | null;
  default_key: string | null;
  lyrics: string | null;
  chords: string | null;
  status: string;
  created_at: string;
  cached_at?: number;
}

export async function getCachedSong(id: string): Promise<CachedSong | undefined> {
  return txGet<CachedSong>("songs", id);
}

export async function putSong(song: CachedSong): Promise<void> {
  return txPut("songs", { ...song, cached_at: Date.now() });
}

export async function putSongs(songs: CachedSong[]): Promise<void> {
  for (const song of songs) {
    await putSong(song);
  }
}

export async function getAllCachedSongs(): Promise<CachedSong[]> {
  return txGetAll<CachedSong>("songs");
}

// ---------------------------------------------------------------------------
// Setlists (with sections)
// ---------------------------------------------------------------------------

export interface CachedSetlistSection {
  id: string;
  setlist_id: string;
  song_id: string;
  section_type: string;
  sort_order: number;
  notes: string | null;
  song_key: string | null;
  override_lyrics: string | null;
  created_at: string;
  songs: {
    id: string;
    title: string;
    author: string | null;
    category: string | null;
    language: string | null;
    default_key: string | null;
    default_bpm: number | null;
    default_time_signature: string | null;
    lyrics: string | null;
    chords: string | null;
    status: string;
  };
}

export interface CachedSetlist {
  id: string;
  date: string;
  title: string | null;
  description: string | null;
  song_leader: string | null;
  branch: string;
  spotify_playlist_id: string | null;
  spotify_playlist_url: string | null;
  section_order: string[] | null;
  created_at: string;
  sections: CachedSetlistSection[];
  cached_at: number;
}

export async function getCachedSetlist(id: string): Promise<CachedSetlist | undefined> {
  return txGet<CachedSetlist>("setlists", id);
}

export async function putSetlist(setlist: CachedSetlist): Promise<void> {
  return txPut("setlists", { ...setlist, cached_at: Date.now() });
}

export async function getAllCachedSetlists(): Promise<CachedSetlist[]> {
  return txGetAll<CachedSetlist>("setlists");
}

// ---------------------------------------------------------------------------
// API response cache (for generic GET requests)
// ---------------------------------------------------------------------------

interface CachedApiResponse {
  url: string;
  status: number;
  body: unknown;
  headers: Record<string, string>;
  cached_at: number;
}

export async function getCachedApiResponse(url: string): Promise<CachedApiResponse | undefined> {
  return txGet<CachedApiResponse>("api-cache", url);
}

export async function putApiResponse(
  url: string,
  status: number,
  body: unknown,
  headers: Record<string, string> = {}
): Promise<void> {
  return txPut("api-cache", { url, status, body, headers, cached_at: Date.now() });
}

// ---------------------------------------------------------------------------
// Bulk cache for song list (stored as a single entry for simplicity)
// ---------------------------------------------------------------------------

const SONG_LIST_KEY = "__song_list__";

export async function getCachedSongList(): Promise<CachedSong[] | undefined> {
  const entry = await txGet<{ songs: CachedSong[]; cached_at: number }>("api-cache", SONG_LIST_KEY);
  if (!entry) return undefined;
  return entry.songs;
}

export async function putSongList(songs: CachedSong[]): Promise<void> {
  return txPut("api-cache", { url: SONG_LIST_KEY, status: 200, body: songs, headers: {}, cached_at: Date.now() });
}
