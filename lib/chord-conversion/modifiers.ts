// ============================================================
// Chord Modifier Definitions
// ============================================================

import type { ChordModifier } from "./types";

/**
 * Maps modifier strings to their display notation.
 * Longer modifiers must come before shorter ones to ensure correct matching.
 */
export const MODIFIER_DISPLAY: Record<ChordModifier, string> = {
  "maj7": "maj7",
  "dim7": "dim7",
  "sus4": "sus4",
  "sus2": "sus2",
  "add9": "add9",
  "dom7": "7",
  "min": "m",
  "maj": "M",
  "m7": "m7",
  "dim": "dim",
  "7": "7",
  "m": "m",
  "M": "M",
  "6": "6",
  "9": "9",
  "11": "11",
  "13": "13",
};

/**
 * Ordered list of modifier patterns to match during parsing.
 * Longer patterns come first to ensure correct matching.
 */
export const MODIFIER_PATTERNS: ChordModifier[] = [
  "maj7",
  "dim7",
  "sus4",
  "sus2",
  "add9",
  "dom7",
  "min",
  "maj",
  "m7",
  "dim",
  "7",
  "m",
  "M",
  "6",
  "9",
  "11",
  "13",
];

/**
 * Check if a string starts with a valid modifier pattern.
 * Returns the matched modifier or null.
 */
export function matchModifier(input: string): ChordModifier | null {
  for (const pattern of MODIFIER_PATTERNS) {
    if (input.startsWith(pattern)) {
      return pattern;
    }
  }
  return null;
}

/**
 * Get the display string for a modifier.
 */
export function getModifierDisplay(modifier: ChordModifier): string {
  return MODIFIER_DISPLAY[modifier];
}
