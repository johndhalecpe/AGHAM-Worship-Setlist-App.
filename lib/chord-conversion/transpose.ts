import { parseLetterChord } from "./letter-parser";
import type { Accidental } from "./types";

const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

const SEMITONE_TO_SHARP = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

function shiftNoteRoot(letter: string, accidental: Accidental | null, semitones: number): string {
  const base = NOTE_TO_SEMITONE[letter];
  if (base === undefined) return letter + (accidental ?? "");
  const current = accidental === "#" ? (base + 1) % 12 : accidental === "b" ? (base + 11) % 12 : base;
  const shifted = ((current + semitones) % 12 + 12) % 12;
  return SEMITONE_TO_SHARP[shifted];
}

function transposeChordToken(chord: string, semitones: number): string {
  const parsed = parseLetterChord(chord);
  if (!parsed) return chord;

  const newRoot = shiftNoteRoot(parsed.rootLetter, parsed.rootAccidental, semitones);
  let result = newRoot;

  if (parsed.modifier) result += parsed.modifier;

  if (parsed.bassLetter) {
    const newBass = shiftNoteRoot(parsed.bassLetter, parsed.bassAccidental, semitones);
    result += `/${newBass}`;
  }

  return result;
}

interface Token {
  value: string;
  isChord: boolean;
}

function tokenizeLetterString(input: string): Token[] {
  const tokens: Token[] = [];
  let current = "";

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if ("CDEFGAB".includes(char) && current.length > 0) {
      const lastChar = current[current.length - 1];
      if ("CDEFGAB#bmM2469)".includes(lastChar)) {
        if (current.trim().length > 0) {
          tokens.push({ value: current.trim(), isChord: true });
        }
        current = "";
      }
    }

    if (char === " " || char === "-" || char === "\t" || char === "\n" || char === "\r") {
      if (current.trim().length > 0) {
        tokens.push({ value: current.trim(), isChord: /^[A-G]/.test(current) });
      }
      if (char !== " ") {
        tokens.push({ value: char, isChord: false });
      } else if (current.trim().length > 0) {
        tokens.push({ value: " ", isChord: false });
      }
      current = "";
      continue;
    }

    if (",;/".includes(char)) {
      if (current.trim().length > 0) {
        tokens.push({ value: current.trim(), isChord: true });
      }
      tokens.push({ value: char, isChord: false });
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim().length > 0) {
    tokens.push({ value: current.trim(), isChord: /^[A-G]/.test(current) });
  }

  return tokens;
}

export function transposeLetterChords(chords: string, semitones: number): string {
  if (semitones === 0) return chords;

  const tokens = tokenizeLetterString(chords);
  return tokens
    .map((t) => (t.isChord ? transposeChordToken(t.value, semitones) : t.value))
    .join("");
}

export function transposeKey(key: string, semitones: number): string {
  if (semitones === 0) return key;

  const trimmed = key.trim();
  const isMinor = trimmed.endsWith("m");
  const notePart = isMinor ? trimmed.slice(0, -1) : trimmed;

  const letter = notePart.charAt(0);
  if (!"CDEFGAB".includes(letter)) return key;

  let acc: Accidental | null = null;
  if (notePart.length > 1) {
    const second = notePart[1];
    if (second === "#" || second === "b") acc = second as Accidental;
  }

  const newNote = shiftNoteRoot(letter, acc, semitones);
  return isMinor ? `${newNote}m` : newNote;
}
