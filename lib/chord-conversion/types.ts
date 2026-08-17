// ============================================================
// Nashville Chord Conversion Types
// ============================================================

/** A single digit from 1-7 representing a scale degree */
export type Degree = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Accidental that modifies the root note */
export type Accidental = "#" | "b";

/**
 * Supported chord modifiers.
 * This is a controlled list - only add modifiers that are actually used.
 */
export type ChordModifier =
  | "7"       // dominant 7th
  | "m"       // minor
  | "min"     // minor (alias)
  | "m7"      // minor 7th
  | "M"       // major (non-default)
  | "maj"     // major (alias)
  | "maj7"    // major 7th
  | "dim"     // diminished
  | "dim7"    // diminished 7th
  | "dom7"    // dominant 7th (explicit)
  | "sus2"    // suspended 2nd
  | "sus4"    // suspended 4th
  | "add9"    // add 9th
  | "6"       // major 6th
  | "9"       // dominant 9th
  | "11"      // dominant 11th
  | "13";     // dominant 13th

/**
 * A parsed Nashville chord token.
 * This is the intermediate representation before conversion to letter chords.
 */
export interface ParsedNashvilleChord {
  type: "chord";
  /** The original raw text that was parsed */
  raw: string;
  /** Scale degree (1-7) */
  degree: Degree;
  /** Optional accidental modifying the root note */
  accidental: Accidental | null;
  /** Optional chord modifier (quality, extensions, etc.) */
  modifier: ChordModifier | null;
  /** Optional bass note for slash chords (e.g., G/B = degree 5 with bass degree 3) */
  bassDegree: Degree | null;
}

/**
 * A separator token (dash, space, etc.) that appears between chords.
 */
export interface SeparatorToken {
  type: "separator";
  value: string;
}

/**
 * A parenthesis/bracket token for structural formatting.
 */
export interface StructuralToken {
  type: "parenthesis_open" | "parenthesis_close" | "bracket_open" | "bracket_close";
  value: string;
}

/**
 * A repeat indicator token (e.g., "(2x)").
 */
export interface RepeatToken {
  type: "repeat";
  value: string;
}

/**
 * A literal text token that is not a chord (e.g., section labels).
 */
export interface LiteralToken {
  type: "literal";
  value: string;
}

/**
 * Union of all token types that can appear in a parsed Nashville string.
 */
export type ParsedToken =
  | ParsedNashvilleChord
  | SeparatorToken
  | StructuralToken
  | RepeatToken
  | LiteralToken;

/**
 * The result of parsing a Nashville chord string.
 */
export interface ParseResult {
  /** All tokens in order */
  tokens: ParsedToken[];
  /** Whether parsing succeeded without errors */
  success: boolean;
  /** Any parsing errors encountered */
  errors: string[];
}

/**
 * A note in the chromatic scale with proper spelling for a given key.
 */
export interface Note {
  /** The note letter name (C, D, E, F, G, A, B) */
  letter: string;
  /** Optional accidental (# or b) */
  accidental: Accidental | null;
  /** Enharmonic spelling preference (sharp or flat) */
  spelling: "sharp" | "flat" | "natural";
}

/**
 * The result of converting a single Nashville chord to a letter chord.
 */
export interface ConvertedChord {
  /** The original parsed Nashville chord */
  parsed: ParsedNashvilleChord;
  /** The letter chord string (e.g., "G#m", "E7", "B/F#") */
  letterChord: string;
  /** Whether the conversion was successful */
  success: boolean;
  /** Any conversion errors */
  errors: string[];
}

/**
 * The result of converting an entire Nashville string to letter chords.
 */
export interface ConversionResult {
  /** The converted letter chord string */
  output: string;
  /** Individual converted chords */
  chords: ConvertedChord[];
  /** Whether all conversions succeeded */
  success: boolean;
  /** Any conversion errors */
  errors: string[];
}
