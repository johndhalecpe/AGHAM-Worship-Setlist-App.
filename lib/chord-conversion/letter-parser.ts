// ============================================================
// Letter Chord Parser
// ============================================================
// Parses letter chord notation (C, Dm, G7, F#m7, Bb/F, etc.)
// into structured components for conversion to Nashville.

import type { Accidental, ChordModifier } from "./types";
import { matchModifier } from "./modifiers";

/**
 * A parsed letter chord with all its components.
 */
export interface ParsedLetterChord {
  /** The root note letter (A-G) */
  rootLetter: string;
  /** Optional accidental on the root (# or b) */
  rootAccidental: Accidental | null;
  /** The chord modifier (quality, extensions) */
  modifier: ChordModifier | null;
  /** The slash bass note letter (A-G) if present */
  bassLetter: string | null;
  /** Accidental on the bass note */
  bassAccidental: Accidental | null;
  /** The original raw string that was parsed */
  raw: string;
}

// ============================================================
// Parsing
// ============================================================

/**
 * Parse a single letter chord string into its components.
 *
 * Handles formats like:
 * - C, D, E, F, G, A, B (bare major)
 * - Cm, Dm7, Emaj, F#m, G#dim7
 * - Bb/F, C#/G#, Dm/A
 *
 * Returns null if the input is not a valid letter chord.
 */
export function parseLetterChord(input: string): ParsedLetterChord | null {
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;

  let rest = trimmed;

  // Parse root note letter
  const rootLetter = rest.charAt(0);
  if (!"CDEFGAB".includes(rootLetter)) return null;
  rest = rest.slice(1);

  // Parse root accidental
  let rootAccidental: Accidental | null = null;
  if (rest.length > 0 && (rest[0] === "#" || rest[0] === "b")) {
    rootAccidental = rest[0] as Accidental;
    rest = rest.slice(1);
  }

  // Parse modifier (quality/extensions)
  let modifier: ChordModifier | null = null;
  if (rest.length > 0) {
    const matchedModifier = matchModifier(rest);
    if (matchedModifier) {
      modifier = matchedModifier;
      rest = rest.slice(matchedModifier.length);
    }
  }

  // Parse slash bass if present
  let bassLetter: string | null = null;
  let bassAccidental: Accidental | null = null;

  if (rest.length > 0 && rest[0] === "/") {
    rest = rest.slice(1); // skip the slash

    if (rest.length > 0) {
      bassLetter = rest.charAt(0);
      if (!"CDEFGAB".includes(bassLetter)) return null;
      rest = rest.slice(1);

      if (rest.length > 0 && (rest[0] === "#" || rest[0] === "b")) {
        bassAccidental = rest[0] as Accidental;
        rest = rest.slice(1);
      }
    }
  }

  // If there's remaining unparsed content, it's not a valid chord
  if (rest.length > 0) return null;

  return {
    rootLetter,
    rootAccidental,
    modifier,
    bassLetter,
    bassAccidental,
    raw: trimmed,
  };
}

/**
 * Check if a string looks like it could be a letter chord.
 * This is a quick heuristic check before full parsing.
 */
export function looksLikeLetterChord(input: string): boolean {
  const trimmed = input.trim();
  if (trimmed.length === 0) return false;

  // Must start with a note letter
  const firstChar = trimmed[0];
  if (!"CDEFGAB".includes(firstChar)) return false;

  // If it has a second character, check if it's accidental or modifier
  if (trimmed.length === 1) return true; // single note letter = valid chord

  const secondChar = trimmed[1];
  // Valid second chars: accidental, modifier start, slash
  if ("#b".includes(secondChar)) return true;
  if ("mMs7d2469".includes(secondChar)) return true;
  if (secondChar === "/") return true;

  return false;
}
