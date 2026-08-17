// ============================================================
// Nashville Chord Conversion - Public API
// ============================================================

// Main conversion functions
export { nashvilleToLetter, letterToNashville, convertChord, isLetterChordFormat } from "./converter";

// Transpose
export { transposeLetterChords, transposeKey } from "./transpose";

// Parser functions
export { parseNashville, isChordToken, isSeparatorToken, isStructuralToken, isRepeatToken, extractChords } from "./parser";

// Letter parser
export { parseLetterChord, looksLikeLetterChord } from "./letter-parser";
export type { ParsedLetterChord } from "./letter-parser";

// Scale utilities
export { parseKey, keyToSemitone, degreeToNote, applyAccidental, noteToString, getDefaultQualitySuffix } from "./scale";

// Modifier utilities
export { matchModifier, getModifierDisplay, MODIFIER_PATTERNS } from "./modifiers";

// Types
export type {
  Degree,
  Accidental,
  ChordModifier,
  ParsedNashvilleChord,
  ParsedToken,
  SeparatorToken,
  StructuralToken,
  RepeatToken,
  LiteralToken,
  ParseResult,
  Note,
  ConvertedChord,
  ConversionResult,
} from "./types";

export type { ParsedKey } from "./scale";
