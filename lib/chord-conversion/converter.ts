// ============================================================
// Nashville to Letter Chord Converter
// ============================================================

import type {
  Accidental,
  ChordModifier,
  ConversionResult,
  ConvertedChord,
  Degree,
  ParseResult,
  ParsedNashvilleChord,
  ParsedToken,
} from "./types";
import { parseNashville, isChordToken } from "./parser";
import { getModifierDisplay, MODIFIER_PATTERNS } from "./modifiers";
import {
  parseKey,
  keyToSemitone,
  degreeToNote,
  applyAccidental,
  noteToString,
  getDefaultQualitySuffix,
} from "./scale";
import { parseLetterChord, type ParsedLetterChord } from "./letter-parser";

// ============================================================
// Main Conversion Functions
// ============================================================

/**
 * Convert a Nashville chord string to letter chords using the song's key.
 *
 * @param nashvilleString - The raw Nashville chord notation
 * @param key - The song's key (e.g., "E", "C#m", "Bb")
 * @returns ConversionResult with the converted letter chord string
 */
export function nashvilleToLetter(
  nashvilleString: string,
  key: string
): ConversionResult {
  // Parse the key
  const parsedKey = parseKey(key);
  if (!parsedKey) {
    return {
      output: nashvilleString,
      chords: [],
      success: false,
      errors: [`Invalid key: ${key}`],
    };
  }

  // Parse the Nashville string
  const parseResult = parseNashville(nashvilleString);

  // Convert each token
  const output = convertTokens(parseResult.tokens, parsedKey);

  return {
    output,
    chords: parseResult.tokens
      .filter(isChordToken)
      .map((token) => convertChord(token, parsedKey)),
    success: parseResult.success,
    errors: parseResult.errors,
  };
}

/**
 * Convert a single Nashville chord to a letter chord.
 *
 * @param parsed - The parsed Nashville chord
 * @param key - The parsed key
 * @returns ConvertedChord with the letter chord string
 */
export function convertChord(
  parsed: ParsedNashvilleChord,
  key: { letter: string; accidental: Accidental | null; isMinor: boolean }
): ConvertedChord {
  const errors: string[] = [];

  try {
    // Get the base note for this degree
    const baseNote = degreeToNote(parsed.degree, key);

    // Apply accidental if present
    const rootNote = parsed.accidental
      ? applyAccidental(baseNote, parsed.accidental)
      : baseNote;

    // Determine the chord quality
    const quality = getChordQuality(parsed.degree, parsed.modifier, parsed.accidental);

    // Build the root chord string
    let chordStr = noteToString(rootNote) + quality;

    // Add bass note if present (slash chord)
    if (parsed.bassDegree !== null) {
      const bassNote = degreeToNote(parsed.bassDegree, key);
      chordStr += `/${noteToString(bassNote)}`;
    }

    return {
      parsed,
      letterChord: chordStr,
      success: true,
      errors,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    errors.push(`Failed to convert chord ${parsed.raw}: ${message}`);
    return {
      parsed,
      letterChord: parsed.raw, // Fallback to original
      success: false,
      errors,
    };
  }
}

// ============================================================
// Token Conversion
// ============================================================

/**
 * Convert an array of parsed tokens to a letter chord string.
 */
function convertTokens(tokens: ParsedToken[], key: Parameters<typeof convertChord>[1]): string {
  let output = "";

  for (const token of tokens) {
    if (isChordToken(token)) {
      const converted = convertChord(token, key);
      output += converted.letterChord;
    } else {
      // Preserve separators, structural chars, repeats, literals as-is
      output += token.value;
    }
  }

  return output;
}

// ============================================================
// Chord Quality Determination
// ============================================================

/**
 * Determine the chord quality string based on degree, modifier, and accidental.
 *
 * Rules:
 * - Bare degree: use default quality (1,4,5=major; 2,3,6=minor; 7=diminished)
 * - With accidental: no automatic quality suffix
 * - With explicit modifier: use that modifier's display
 */
function getChordQuality(
  degree: Degree,
  modifier: ChordModifier | null,
  accidental: Accidental | null
): string {
  // If there's an explicit modifier, use it
  if (modifier !== null) {
    return getModifierDisplay(modifier);
  }

  // If there's an accidental, no automatic quality
  // (per the custom notation rules)
  if (accidental !== null) {
    return "";
  }

  // Use default quality for bare degree
  return getDefaultQualitySuffix(degree);
}

// ============================================================
// Utility Functions
// ============================================================

export function isLetterChordFormat(input: string): boolean {
  const trimmed = input.trim();
  if (trimmed.length === 0) return false;

  const lines = trimmed.split("\n");

  for (const line of lines) {
    const lineTrimmed = line.trim();
    if (lineTrimmed.length === 0) continue;
    if (/^[\[\(]/.test(lineTrimmed)) continue;

    const tokens = lineTrimmed.split(/[\s\-|]+/).filter(t => t.length > 0);
    for (const token of tokens) {
      const cleaned = token.replace(/^[\[\(\{]+|[\]\)\}]+$/g, "");
      if (cleaned.length === 0) continue;

      if (/^[1-7]/.test(cleaned)) {
        return false;
      }

      if (/^[A-G][#b]?/.test(cleaned)) {
        return true;
      }
    }
  }

  const notePattern = /^[A-G][#b]?/;
  return notePattern.test(trimmed);
}

// ============================================================
// Letter to Nashville Converter
// ============================================================

/**
 * Convert a letter chord string to Nashville notation using the song's key.
 *
 * @param letterString - The raw letter chord notation (e.g., "C Dm G7")
 * @param key - The song's key (e.g., "E", "C#m", "Bb")
 * @returns ConversionResult with the converted Nashville string
 */
export function letterToNashville(
  letterString: string,
  key: string
): ConversionResult {
  const parsedKey = parseKey(key);
  if (!parsedKey) {
    return {
      output: letterString,
      chords: [],
      success: false,
      errors: [`Invalid key: ${key}`],
    };
  }

  const rootSemitone = keyToSemitone(parsedKey);
  const scale = buildNoteToDegreeMap(rootSemitone);
  const tokens = tokenizeLetterString(letterString);

  const output = tokens.map((token) => {
    if (token.isChord) {
      return convertLetterChordToNashville(token.value, scale, parsedKey);
    }
    return token.value;
  }).join("");

  const chords = tokens
    .filter((t) => t.isChord)
    .map((t) => {
      const parsed = parseLetterChord(t.value);
      if (!parsed) {
        return {
          parsed: null as unknown as ParsedNashvilleChord,
          letterChord: t.value,
          success: false,
          errors: [`Failed to parse: ${t.value}`],
        };
      }
      return convertSingleLetterChord(parsed, scale, parsedKey);
    });

  return {
    output,
    chords,
    success: true,
    errors: [],
  };
}

/**
 * Build a map from note semitone to scale degree (1-7).
 * Only maps notes that are in the major scale (no accidentals).
 */
function buildNoteToDegreeMap(rootSemitone: number): Map<number, Degree> {
  const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11] as const;
  const map = new Map<number, Degree>();

  for (let i = 0; i < 7; i++) {
    const semitone = (rootSemitone + MAJOR_SCALE_INTERVALS[i]) % 12;
    map.set(semitone, (i + 1) as Degree);
  }

  return map;
}

/**
 * A token from the letter string with its type.
 */
interface LetterToken {
  value: string;
  isChord: boolean;
}

function tokenizeLetterString(input: string): LetterToken[] {
  const tokens: LetterToken[] = [];
  let current = "";

  const flushCurrent = () => {
    const trimmed = current.trim();
    if (trimmed.length > 0) {
      tokens.push({ value: trimmed, isChord: /^[A-G]/.test(trimmed) });
    }
    current = "";
  };

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (char === "(" || char === ")") {
      flushCurrent();
      tokens.push({ value: char, isChord: false });
      continue;
    }

    if (" \t\n\r-,:;/".includes(char)) {
      flushCurrent();
      if (" \t\n\r".includes(char)) {
        const last = tokens[tokens.length - 1];
        if (!last || last.value !== " ") {
          tokens.push({ value: " ", isChord: false });
        }
      } else {
        tokens.push({ value: char, isChord: false });
      }
      continue;
    }

    if ("CDEFGAB".includes(char) && current.length > 0) {
      const lastChar = current[current.length - 1];
      if ("CDEFGAB#b".includes(lastChar)) {
        flushCurrent();
      }
    }

    current += char;
  }

  flushCurrent();
  return tokens;
}

function convertLetterChordToNashville(
  chordStr: string,
  scale: Map<number, Degree>,
  key: ReturnType<typeof parseKey> & object
): string {
  const parsed = parseLetterChord(chordStr);
  if (!parsed) return chordStr;

  const result = convertSingleLetterChord(parsed, scale, key);
  return result.success ? result.letterChord : chordStr;
}

/**
 * Convert a single parsed letter chord to Nashville notation.
 * Maps root note to scale degree, preserves modifier, handles slash bass.
 */
function convertSingleLetterChord(
  parsed: ParsedLetterChord,
  scale: Map<number, Degree>,
  key: { letter: string; accidental: Accidental | null; isMinor: boolean }
): ConvertedChord {
  const errors: string[] = [];

  try {
    const rootSemitone = noteToSemitone(parsed.rootLetter, parsed.rootAccidental);
    let degree = scale.get(rootSemitone);
    let usedAccidental: Accidental | null = null;

    if (degree === undefined) {
      if (parsed.rootAccidental === "#") {
        const naturalSemitone = (rootSemitone + 11) % 12;
        degree = scale.get(naturalSemitone);
        usedAccidental = "#";
      } else if (parsed.rootAccidental === "b") {
        const naturalSemitone = (rootSemitone + 1) % 12;
        degree = scale.get(naturalSemitone);
        usedAccidental = "b";
      } else {
        const flatSemitone = (rootSemitone + 1) % 12;
        const flatDegree = scale.get(flatSemitone);
        if (flatDegree !== undefined) {
          degree = flatDegree;
          usedAccidental = "b";
        } else {
          const sharpSemitone = (rootSemitone + 11) % 12;
          const sharpDegree = scale.get(sharpSemitone);
          if (sharpDegree !== undefined) {
            degree = sharpDegree;
            usedAccidental = "#";
          }
        }
      }
    }

    if (degree === undefined) {
      errors.push(`Cannot map note ${parsed.rootLetter}${parsed.rootAccidental ?? ""} to scale degree in key of ${key.letter}`);
      return {
        parsed: null as unknown as ParsedNashvilleChord,
        letterChord: parsed.raw,
        success: false,
        errors,
      };
    }

    let nashvilleStr = degree.toString();

    if (usedAccidental !== null) {
      nashvilleStr += usedAccidental;
    }

    const defaultQuality = getDefaultQualitySuffix(degree);

    if (parsed.modifier !== null) {
      const modifierDisplay = getModifierDisplay(parsed.modifier);
      if (modifierDisplay !== defaultQuality) {
        nashvilleStr += parsed.modifier;
      }
    }

    if (parsed.bassLetter !== null) {
      const bassSemitone = noteToSemitone(parsed.bassLetter, parsed.bassAccidental);
      let bassDegree = scale.get(bassSemitone);

      if (bassDegree === undefined) {
        if (parsed.bassAccidental === "#") {
          bassDegree = scale.get((bassSemitone + 11) % 12);
        } else if (parsed.bassAccidental === "b") {
          bassDegree = scale.get((bassSemitone + 1) % 12);
        }
      }

      if (bassDegree !== undefined) {
        nashvilleStr += `/${bassDegree}`;
      } else {
        nashvilleStr += `/${parsed.bassLetter}${parsed.bassAccidental ?? ""}`;
        errors.push(`Bass note ${parsed.bassLetter} not in scale`);
      }
    }

    return {
      parsed: null as unknown as ParsedNashvilleChord,
      letterChord: nashvilleStr,
      success: true,
      errors,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    errors.push(`Failed to convert chord ${parsed.raw}: ${message}`);
    return {
      parsed: null as unknown as ParsedNashvilleChord,
      letterChord: parsed.raw,
      success: false,
      errors,
    };
  }
}

function noteToSemitone(letter: string, accidental: Accidental | null): number {
  const NOTE_TO_SEMITONE: Record<string, number> = {
    C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
  };
  const base = NOTE_TO_SEMITONE[letter];
  if (accidental === "#") return (base + 1) % 12;
  if (accidental === "b") return (base + 11) % 12;
  return base;
}
