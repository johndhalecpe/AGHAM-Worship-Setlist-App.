// ============================================================
// Nashville Notation Parser
// ============================================================
//
// Grammar:
//   CHORD = DEGREE + OPTIONAL_ACCIDENTAL + OPTIONAL_MODIFIER
//   DEGREE = exactly one digit from 1-7
//   ACCIDENTAL = # or b (immediately after degree)
//   MODIFIER = supported chord modifier
//
// Boundary Rules:
//   - Separators (-, space, /, etc.) end a chord
//   - 2 digits where second is 7 = modifier (dominant 7th)
//   - 2 digits where second is NOT 7 = separate chords
//   - 3+ digits = each digit is a separate chord
//
// ============================================================

import type {
  Accidental,
  ChordModifier,
  Degree,
  ParseResult,
  ParsedNashvilleChord,
  ParsedToken,
  RepeatToken,
  SeparatorToken,
  StructuralToken,
} from "./types";
import { matchModifier } from "./modifiers";

// ============================================================
// Constants
// ============================================================

/** Characters that separate chords */
const SEPARATORS = new Set(["-", " ", "\t"]);

/** Characters that are structural (parentheses, brackets) */
const STRUCTURAL_CHARS = new Set(["(", ")", "[", "]"]);

/** Valid degree digits */
const VALID_DEGREES = new Set(["1", "2", "3", "4", "5", "6", "7"]);

// ============================================================
// Main Parser Function
// ============================================================

/**
 * Parse a Nashville chord string into tokens.
 *
 * @param input - The raw Nashville chord string
 * @returns ParseResult with tokens and any errors
 */
export function parseNashville(input: string): ParseResult {
  const tokens: ParsedToken[] = [];
  const errors: string[] = [];
  let pos = 0;
  let insideBracket = false;

  while (pos < input.length) {
    const char = input[pos];

    if (insideBracket) {
      if (char === "]") {
        tokens.push({ type: "bracket_close", value: "]" });
        insideBracket = false;
        pos++;
        continue;
      }
      tokens.push({ type: "literal", value: char });
      pos++;
      continue;
    }

    if (SEPARATORS.has(char)) {
      tokens.push({ type: "separator", value: char });
      pos++;
      continue;
    }

    if (char === "[") {
      tokens.push({ type: "bracket_open", value: "[" });
      insideBracket = true;
      pos++;
      continue;
    }

    if (char === "(") {
      const repeatMatch = input.slice(pos).match(/^\(\d+x\)/);
      if (repeatMatch) {
        tokens.push({ type: "repeat", value: repeatMatch[0] });
        pos += repeatMatch[0].length;
        continue;
      }
      tokens.push({ type: "parenthesis_open", value: "(" });
      pos++;
      continue;
    }

    if (char === ")") {
      tokens.push({ type: "parenthesis_close", value: ")" });
      pos++;
      continue;
    }

    if (VALID_DEGREES.has(char)) {
      const result = parseDigitSequence(input, pos);
      tokens.push(...result.tokens);
      pos = result.newPos;
      continue;
    }

    tokens.push({ type: "literal", value: char });
    pos++;
  }

  return {
    tokens,
    success: errors.length === 0,
    errors,
  };
}

// ============================================================
// Digit Sequence Parser
// ============================================================

interface DigitParseResult {
  tokens: ParsedToken[];
  newPos: number;
}

/**
 * Parse a digit sequence starting at the given position.
 * Handles the complex rules for 2-digit and 3+ digit sequences.
 */
function parseDigitSequence(input: string, startPos: number): DigitParseResult {
  const tokens: ParsedToken[] = [];
  let pos = startPos;

  // Read the first digit (degree)
  const firstDigit = input[pos];
  const degree = parseInt(firstDigit) as Degree;
  pos++;

  // Check what comes after the first digit
  if (pos >= input.length) {
    // End of string - just the degree
    tokens.push(createChordToken(degree, null, null, null, firstDigit));
    return { tokens, newPos: pos };
  }

  const nextChar = input[pos];

  // If next char is not a digit, check for accidental or modifier
  if (!VALID_DEGREES.has(nextChar)) {
    return parseChordTail(input, pos, degree, firstDigit);
  }

  // Next char IS a digit - check if there's a third digit
  const afterNext = pos + 1 < input.length ? input[pos + 1] : null;

  if (afterNext === null || !VALID_DEGREES.has(afterNext)) {
    // Exactly 2 digits total
    // Check if second digit is 7 (modifier) or not (separate chords)
    if (nextChar === "7") {
      // 37, 57, etc. = degree + modifier 7
      const chordRaw = firstDigit + "7";
      tokens.push(createChordToken(degree, null, "7", null, chordRaw));
      pos++;
      return { tokens, newPos: pos };
    } else {
      // 51, 23, etc. = two separate chords
      // First chord is just the degree
      tokens.push(createChordToken(degree, null, null, null, firstDigit));
      // Second chord will be parsed in next iteration
      return { tokens, newPos: pos };
    }
  }

  // 3+ digits ahead = separate chords
  // First chord is just the degree
  tokens.push(createChordToken(degree, null, null, null, firstDigit));
  // Remaining digits will be parsed in next iteration
  return { tokens, newPos: pos };
}

// ============================================================
// Chord Tail Parser
// ============================================================

/**
 * Parse the tail of a chord (accidental, modifier, slash chord) after the degree.
 */
function parseChordTail(
  input: string,
  startPos: number,
  degree: Degree,
  degreeChar: string
): DigitParseResult {
  const tokens: ParsedToken[] = [];
  let pos = startPos;
  let accidental: Accidental | null = null;
  let modifier: ChordModifier | null = null;
  let bassDegree: Degree | null = null;

  // Check for accidental
  if (pos < input.length) {
    const char = input[pos];
    if (char === "#" || char === "b") {
      accidental = char as Accidental;
      pos++;
    }
  }

  // Check for named modifier (dom7, dim7, m, min, etc.)
  if (pos < input.length) {
    const remaining = input.slice(pos);
    const matchedModifier = matchModifier(remaining);
    if (matchedModifier) {
      modifier = matchedModifier;
      pos += matchedModifier.length;
    }
  }

  // Check for slash chord (bass degree)
  if (pos < input.length && input[pos] === "/") {
    pos++; // skip the slash
    if (pos < input.length && VALID_DEGREES.has(input[pos])) {
      bassDegree = parseInt(input[pos]) as Degree;
      pos++;
    }
  }

  // Build the raw string for this chord
  const raw = input.slice(startPos - 1, pos); // -1 to include the degree

  tokens.push(createChordToken(degree, accidental, modifier, bassDegree, raw));

  return { tokens, newPos: pos };
}

// ============================================================
// Token Creation
// ============================================================

/**
 * Create a ParsedNashvilleChord token.
 */
function createChordToken(
  degree: Degree,
  accidental: Accidental | null,
  modifier: ChordModifier | null,
  bassDegree: Degree | null,
  raw: string
): ParsedNashvilleChord {
  return {
    type: "chord",
    raw,
    degree,
    accidental,
    modifier,
    bassDegree,
  };
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Check if a token is a chord token.
 */
export function isChordToken(token: ParsedToken): token is ParsedNashvilleChord {
  return "degree" in token;
}

/**
 * Check if a token is a separator.
 */
export function isSeparatorToken(token: ParsedToken): token is SeparatorToken {
  return token.type === "separator";
}

/**
 * Check if a token is a structural character.
 */
export function isStructuralToken(
  token: ParsedToken
): token is StructuralToken {
  return (
    token.type === "parenthesis_open" ||
    token.type === "parenthesis_close" ||
    token.type === "bracket_open" ||
    token.type === "bracket_close"
  );
}

/**
 * Check if a token is a repeat indicator.
 */
export function isRepeatToken(token: ParsedToken): token is RepeatToken {
  return token.type === "repeat";
}

/**
 * Extract all chord tokens from a parse result.
 */
export function extractChords(result: ParseResult): ParsedNashvilleChord[] {
  return result.tokens.filter(isChordToken);
}
