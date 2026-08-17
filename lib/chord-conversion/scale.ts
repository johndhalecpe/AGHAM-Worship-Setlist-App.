// ============================================================
// Scale and Key Utilities
// ============================================================

import type { Accidental, Degree, Note } from "./types";

// ============================================================
// Note Constants
// ============================================================

/** All note letters in order */
const NOTE_LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;

/**
 * Chromatic scale with sharp spelling.
 * Index 0 = C, index 1 = C#/Db, etc.
 */
const SHARP_SPELLING = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
] as const;

/**
 * Chromatic scale with flat spelling.
 */
const FLAT_SPELLING = [
  "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B",
] as const;

/**
 * Semitone offsets for each note letter from C.
 */
const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/**
 * Major scale intervals (in semitones) from the root.
 * W-W-H-W-W-W-H = 0-2-4-5-7-9-11
 */
const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11] as const;

// ============================================================
// Key Parsing
// ============================================================

export interface ParsedKey {
  /** Root note letter (C, D, E, F, G, A, B) */
  letter: string;
  /** Accidental (# or b) */
  accidental: Accidental | null;
  /** Whether this is a minor key */
  isMinor: boolean;
}

/**
 * Parse a key string like "E", "C#m", "Bb", "G#m" into its components.
 */
export function parseKey(key: string): ParsedKey | null {
  const trimmed = key.trim();
  if (!trimmed) return null;

  let rest = trimmed;
  const isMinor = rest.endsWith("m");
  if (isMinor) {
    rest = rest.slice(0, -1);
  }

  if (rest.length === 0) return null;

  let accidental: Accidental | null = null;
  if (rest.endsWith("#")) {
    accidental = "#";
    rest = rest.slice(0, -1);
  } else if (rest.endsWith("b")) {
    accidental = "b";
    rest = rest.slice(0, -1);
  }

  if (rest.length !== 1 || !NOTE_LETTERS.includes(rest as (typeof NOTE_LETTERS)[number])) {
    return null;
  }

  return {
    letter: rest,
    accidental,
    isMinor,
  };
}

/**
 * Get the semitone value (0-11) for a parsed key's root note.
 */
export function keyToSemitone(key: ParsedKey): number {
  const baseSemitone = NOTE_TO_SEMITONE[key.letter];
  if (key.accidental === "#") {
    return (baseSemitone + 1) % 12;
  } else if (key.accidental === "b") {
    return (baseSemitone + 11) % 12; // -1 mod 12
  }
  return baseSemitone;
}

// ============================================================
// Scale Generation
// ============================================================

/**
 * Get the major scale notes for a given key root semitone.
 * Returns an array of 7 notes (one per degree) with proper spelling.
 */
export function getMajorScale(rootSemitone: number): Note[] {
  const scale: Note[] = [];

  for (let i = 0; i < 7; i++) {
    const semitone = (rootSemitone + MAJOR_SCALE_INTERVALS[i]) % 12;
    const note = semitoneToNote(semitone, rootSemitone, i);
    scale.push(note);
  }

  return scale;
}

/**
 * Convert a semitone value (0-11) to a Note with proper spelling.
 * Always uses sharp spelling for consistency with the user's notation.
 * The user's system uses sharps (G#, D#, F#) not flats (Ab, Eb, Gb).
 */
function semitoneToNote(
  semitone: number,
  _rootSemitone: number,
  _degreeIndex: number
): Note {
  const noteStr = SHARP_SPELLING[semitone];
  return parseNoteString(noteStr);
}

/**
 * Parse a note string like "C", "C#", "Db" into a Note object.
 */
function parseNoteString(noteStr: string): Note {
  const letter = noteStr.charAt(0);
  const rest = noteStr.slice(1);

  let accidental: Accidental | null = null;
  let spelling: "sharp" | "flat" | "natural" = "natural";

  if (rest === "#") {
    accidental = "#";
    spelling = "sharp";
  } else if (rest === "b") {
    accidental = "b";
    spelling = "flat";
  }

  return { letter, accidental, spelling };
}

// ============================================================
// Degree to Note Conversion
// ============================================================

/**
 * Convert a scale degree (1-7) to a note in the given key.
 * Returns the note with proper spelling.
 */
export function degreeToNote(degree: Degree, key: ParsedKey): Note {
  const rootSemitone = keyToSemitone(key);
  const scale = getMajorScale(rootSemitone);
  return scale[degree - 1];
}

/**
 * Apply an accidental to a note, returning the new note.
 * Sharp raises by 1 semitone, flat lowers by 1 semitone.
 */
export function applyAccidental(note: Note, accidental: Accidental): Note {
  const baseSemitone = noteToSemitone(note);
  const newSemitone = accidental === "#"
    ? (baseSemitone + 1) % 12
    : (baseSemitone + 11) % 12; // -1 mod 12

  // Determine spelling based on the accidental direction
  const useSharp = accidental === "#";
  const noteStr = useSharp ? SHARP_SPELLING[newSemitone] : FLAT_SPELLING[newSemitone];
  return parseNoteString(noteStr);
}

/**
 * Convert a Note to its semitone value (0-11).
 */
function noteToSemitone(note: Note): number {
  const base = NOTE_TO_SEMITONE[note.letter];
  if (note.accidental === "#") return (base + 1) % 12;
  if (note.accidental === "b") return (base + 11) % 12;
  return base;
}

/**
 * Convert a Note to a string like "C", "C#", "Db".
 */
export function noteToString(note: Note): string {
  if (note.accidental === "#") return `${note.letter}#`;
  if (note.accidental === "b") return `${note.letter}b`;
  return note.letter;
}

// ============================================================
// Default Chord Qualities
// ============================================================

/**
 * Default chord quality for each scale degree in major keys.
 * 1, 4, 5 = Major
 * 2, 3, 6 = Minor
 * 7 = Diminished
 */
export const DEFAULT_QUALITY: Record<Degree, "major" | "minor" | "diminished"> = {
  1: "major",
  2: "minor",
  3: "minor",
  4: "major",
  5: "major",
  6: "minor",
  7: "diminished",
};

/**
 * Get the default quality suffix for a degree.
 * Returns empty string for major, "m" for minor, "dim" for diminished.
 */
export function getDefaultQualitySuffix(degree: Degree): string {
  const quality = DEFAULT_QUALITY[degree];
  switch (quality) {
    case "major":
      return "";
    case "minor":
      return "m";
    case "diminished":
      return "dim";
  }
}
