"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useIsGuest } from "@/lib/hooks/useIsGuest";

export const COLLAB_SAVE_DELAY_MS = 2000;
export const PREVIEW_TIMEOUT_MS = 10_000;

export type PresenceMember = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export type LiveField = {
  value: string;
  authorId: string;
  authorName: string;
  receivedAt: number;
};

type FieldUpdatePayload = {
  fieldKey: string;
  value: string;
  authorId: string;
  authorName: string;
  sentAt: number;
};

type UseSongCollaborationOptions = {
  enabled?: boolean;
  onConflict?: (fieldKey: string, authorName: string) => void;
  getConfirmedValue?: (fieldKey: string) => string | undefined;
};

export function useSongCollaboration(
  songIds: string[],
  options: UseSongCollaborationOptions = {},
) {
  const isGuest = useIsGuest();
  const { enabled = true, onConflict, getConfirmedValue } = options;

  const [liveFields, setLiveFields] = useState<Record<string, LiveField>>({});
  const [presentBySong, setPresentBySong] = useState<Record<string, PresenceMember[]>>({});
  const [selfId, setSelfId] = useState<string>("");

  const identityRef = useRef<{ id: string; name: string } | null>(null);
  const isGuestRef = useRef(isGuest);
  const enabledRef = useRef(enabled);
  const onConflictRef = useRef(onConflict);
  const getConfirmedValueRef = useRef(getConfirmedValue);
  const channelsRef = useRef<Record<string, RealtimeChannel>>({});
  const previewTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    isGuestRef.current = isGuest;
    enabledRef.current = enabled;
    onConflictRef.current = onConflict;
    getConfirmedValueRef.current = getConfirmedValue;
  });

  const songIdsKey = songIds.filter(Boolean).join(",");

  const clearPreview = useCallback((fieldKey: string) => {
    const timer = previewTimersRef.current[fieldKey];
    if (timer) {
      clearTimeout(timer);
      delete previewTimersRef.current[fieldKey];
    }
    setLiveFields((prev) => {
      if (!(fieldKey in prev)) return prev;
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  }, []);

  const broadcastField = useCallback((songId: string, fieldKey: string, value: string) => {
    const identity = identityRef.current;
    const channel = channelsRef.current[songId];
    if (!enabledRef.current || isGuestRef.current || !identity || !channel) return;
    void channel.send({
      type: "broadcast",
      event: "field_update",
      payload: {
        fieldKey,
        value,
        authorId: identity.id,
        authorName: identity.name,
        sentAt: Date.now(),
      } satisfies FieldUpdatePayload,
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadIdentity() {
      if (isGuest) {
        identityRef.current = {
          id: `guest-${Math.random().toString(36).slice(2, 10)}`,
          name: "Guest",
        };
        if (!cancelled) setSelfId(identityRef.current.id);
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      let name = session?.user?.email ?? "Member";
      if (userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", userId)
          .single();
        if (profile?.name) name = profile.name;
      }
      identityRef.current = userId ? { id: userId, name } : null;
      if (!cancelled) setSelfId(userId ?? "");
    }
    void loadIdentity();
    return () => {
      cancelled = true;
    };
  }, [isGuest]);

  useEffect(() => {
    if (!enabled || songIdsKey.length === 0) return;

    const ids = songIdsKey.split(",");
    const channels: Record<string, RealtimeChannel> = {};
    channelsRef.current = channels;

    function handleFieldUpdate(payload: unknown) {
      const message = payload as FieldUpdatePayload;
      const identity = identityRef.current;
      if (!message.fieldKey || !identity || message.authorId === identity.id) return;
      if (previewTimersRef.current[message.fieldKey]) {
        clearTimeout(previewTimersRef.current[message.fieldKey]);
      }
      setLiveFields((prev) => {
        const existing = prev[message.fieldKey];
        if (existing && existing.receivedAt > message.sentAt) return prev;
        return {
          ...prev,
          [message.fieldKey]: {
            value: message.value,
            authorId: message.authorId,
            authorName: message.authorName,
            receivedAt: message.sentAt,
          },
        };
      });
      previewTimersRef.current[message.fieldKey] = setTimeout(
        () => clearPreview(message.fieldKey),
        PREVIEW_TIMEOUT_MS,
      );
      onConflictRef.current?.(message.fieldKey, message.authorName);
    }

    function handlePresenceSync(channel: RealtimeChannel, songId: string) {
      const state = channel.presenceState<PresenceMember>();
      const seen = new Map<string, PresenceMember>();
      for (const entries of Object.values(state)) {
        for (const member of entries) {
          if (member.id && !seen.has(member.id)) {
            seen.set(member.id, member);
          }
        }
      }
      setPresentBySong((prev) => ({ ...prev, [songId]: Array.from(seen.values()) }));
    }

    async function trackWithRetry(channel: RealtimeChannel, attemptsLeft = 5) {
      const identity = identityRef.current;
      if (identity) {
        await channel.track({ id: identity.id, name: identity.name });
        return;
      }
      if (attemptsLeft > 0) {
        setTimeout(() => void trackWithRetry(channel, attemptsLeft - 1), 400);
      }
    }

    for (const songId of ids) {
      const channel = supabase.channel(`song:${songId}`);
      channels[songId] = channel;
      channel
        .on("presence", { event: "sync" }, () => handlePresenceSync(channel, songId))
        .on("broadcast", { event: "field_update" }, ({ payload }) => handleFieldUpdate(payload))
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            void trackWithRetry(channel);
          }
        });
    }

    return () => {
      for (const channel of Object.values(channels)) {
        supabase.removeChannel(channel);
      }
      channelsRef.current = {};
    };
  }, [enabled, songIdsKey, clearPreview]);

  useEffect(() => {
    const getConfirmedValueFn = getConfirmedValueRef.current;
    if (!getConfirmedValueFn) return;
    for (const fieldKey of Object.keys(liveFields)) {
      const confirmed = getConfirmedValueFn(fieldKey);
      if (confirmed !== undefined && confirmed === liveFields[fieldKey].value) {
        clearPreview(fieldKey);
      }
    }
  }, [liveFields, clearPreview]);

  return { liveFields, presentBySong, selfId, broadcastField, clearPreview };
}
