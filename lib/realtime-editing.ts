/**
 * Module-level editing registry shared by the viewers and the realtime hooks.
 *
 * While a scope is being edited locally, realtime UPDATE payloads for that
 * scope are deferred (and payloads older than the last local write are
 * dropped), so remote updates never clobber a user's fresh local edits.
 */

export type RealtimeScope = "songs" | "setlist_sections";

const editing: Record<RealtimeScope, boolean> = {
  songs: false,
  setlist_sections: false,
};

const lastLocalWriteTs: Record<RealtimeScope, number> = {
  songs: 0,
  setlist_sections: 0,
};

export function setRealtimeEditing(scope: RealtimeScope, active: boolean): void {
  editing[scope] = active;
}

export function isRealtimeEditing(scope: RealtimeScope): boolean {
  return editing[scope];
}

export function markLocalWrite(scope: RealtimeScope): void {
  lastLocalWriteTs[scope] = Date.now();
}

export function getLastLocalWriteTs(scope: RealtimeScope): number {
  return lastLocalWriteTs[scope];
}