"use client";

import { useEffect, useState } from "react";

type VisualViewportState = {
  /** Current visual viewport height in CSS px, null before measurement / when unsupported. */
  height: number | null;
  /** Distance from the layout viewport top to the visual viewport top (browser panning). */
  offsetTop: number;
  /** Height of the on-screen keyboard covering the visual viewport, 0 when closed. */
  keyboardInset: number;
};

const INITIAL_STATE: VisualViewportState = {
  height: null,
  offsetTop: 0,
  keyboardInset: 0,
};

/**
 * Tracks the visual viewport so fixed layouts can react to the on-screen
 * keyboard and browser chrome resizing the visible area on mobile, which
 * static 100vh / 100dvh units do not reliably reflect.
 */
export function useVisualViewport(): VisualViewportState {
  const [state, setState] = useState<VisualViewportState>(INITIAL_STATE);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      const height = viewport.height;
      const offsetTop = viewport.offsetTop;
      setState({
        height,
        offsetTop,
        keyboardInset: Math.max(0, window.innerHeight - (height + offsetTop)),
      });
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  return state;
}
