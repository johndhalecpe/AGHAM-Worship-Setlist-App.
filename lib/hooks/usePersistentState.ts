"use client";

import { useState, useCallback } from "react";

export function usePersistentState<T>(
  key: string,
  initialValue: T
): [T, (updater: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initialValue : (JSON.parse(raw) as T);
    } catch {
      return initialValue;
    }
  });

  const setPersistedValue = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next =
          typeof updater === "function"
            ? (updater as (prev: T) => T)(prev)
            : updater;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // storage unavailable — keep in-memory value only
        }
        return next;
      });
    },
    [key]
  );

  return [value, setPersistedValue];
}
