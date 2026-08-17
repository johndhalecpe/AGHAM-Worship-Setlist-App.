// ============================================================
// Converter Tests
// ============================================================

import { describe, it, expect } from "vitest";
import { nashvilleToLetter, letterToNashville, convertChord } from "../converter";
import { parseNashville, extractChords } from "../parser";
import { parseKey } from "../scale";
import type { ParsedNashvilleChord } from "../types";

describe("Nashville to Letter Converter", () => {
  // ============================================================
  // Key E Tests (Primary test case)
  // ============================================================
  describe("Key E", () => {
    it("converts basic degrees correctly", () => {
      expect(nashvilleToLetter("1", "E").output).toBe("E");
      expect(nashvilleToLetter("2", "E").output).toBe("F#m");
      expect(nashvilleToLetter("3", "E").output).toBe("G#m");
      expect(nashvilleToLetter("4", "E").output).toBe("A");
      expect(nashvilleToLetter("5", "E").output).toBe("B");
      expect(nashvilleToLetter("6", "E").output).toBe("C#m");
      expect(nashvilleToLetter("7", "E").output).toBe("D#dim");
    });

    it("converts 37 to G#7 (dominant 7th)", () => {
      const result = nashvilleToLetter("37", "E");
      expect(result.output).toBe("G#7");
    });

    it("converts 3-7 to G#m-D#dim (two chords)", () => {
      const result = nashvilleToLetter("3-7", "E");
      expect(result.output).toBe("G#m-D#dim");
    });

    it("converts 3 7 to G#m D#dim (space separated)", () => {
      const result = nashvilleToLetter("3 7", "E");
      expect(result.output).toBe("G#m D#dim");
    });

    it("converts 6b to C (flat accidental)", () => {
      const result = nashvilleToLetter("6b", "E");
      expect(result.output).toBe("C");
    });

    it("converts 4# to A# (sharp accidental)", () => {
      const result = nashvilleToLetter("4#", "E");
      expect(result.output).toBe("A#");
    });

    it("converts 7b to D (flat on degree 7)", () => {
      const result = nashvilleToLetter("7b", "E");
      expect(result.output).toBe("D");
    });

    it("converts 4m to Am (minor modifier)", () => {
      const result = nashvilleToLetter("4m", "E");
      expect(result.output).toBe("Am");
    });

    it("converts 1min to Em (minor alias)", () => {
      const result = nashvilleToLetter("1min", "E");
      expect(result.output).toBe("Em");
    });

    it("converts 6bdim7 to Cdim7", () => {
      const result = nashvilleToLetter("6bdim7", "E");
      expect(result.output).toBe("Cdim7");
    });

    it("converts 1dom7 to E7 (dominant 7th explicit)", () => {
      const result = nashvilleToLetter("1dom7", "E");
      expect(result.output).toBe("E7");
    });

    it("converts 1/3 to E/G# (slash chord)", () => {
      const result = nashvilleToLetter("1/3", "E");
      expect(result.output).toBe("E/G#");
    });

    it("converts 1dom7/5 to E7/B (slash chord with modifier)", () => {
      const result = nashvilleToLetter("1dom7/5", "E");
      expect(result.output).toBe("E7/B");
    });
  });

  // ============================================================
  // Key C Tests
  // ============================================================
  describe("Key C", () => {
    it("converts basic degrees correctly", () => {
      expect(nashvilleToLetter("1", "C").output).toBe("C");
      expect(nashvilleToLetter("2", "C").output).toBe("Dm");
      expect(nashvilleToLetter("3", "C").output).toBe("Em");
      expect(nashvilleToLetter("4", "C").output).toBe("F");
      expect(nashvilleToLetter("5", "C").output).toBe("G");
      expect(nashvilleToLetter("6", "C").output).toBe("Am");
      expect(nashvilleToLetter("7", "C").output).toBe("Bdim");
    });
  });

  // ============================================================
  // Key G Tests
  // ============================================================
  describe("Key G", () => {
    it("converts basic degrees correctly", () => {
      expect(nashvilleToLetter("1", "G").output).toBe("G");
      expect(nashvilleToLetter("2", "G").output).toBe("Am");
      expect(nashvilleToLetter("3", "G").output).toBe("Bm");
      expect(nashvilleToLetter("4", "G").output).toBe("C");
      expect(nashvilleToLetter("5", "G").output).toBe("D");
      expect(nashvilleToLetter("6", "G").output).toBe("Em");
      expect(nashvilleToLetter("7", "G").output).toBe("F#dim");
    });
  });

  // ============================================================
  // Agnus Dei Full Example
  // ============================================================
  describe("Agnus Dei full example (Key E)", () => {
    it("converts the complete Agnus Dei chord progression", () => {
      const input = `1---4-5
4-2
6 3
(6-2-6-3)-4`;
      const expected = `E---A-B
A-F#m
C#m G#m
(C#m-F#m-C#m-G#m)-A`;

      const result = nashvilleToLetter(input, "E");
      expect(result.output).toBe(expected);
    });
  });

  // ============================================================
  // Complex Song Examples
  // ============================================================
  describe("Complex songs", () => {
    it("converts song with modifiers and slash chords", () => {
      const input = `4 1/3 5 6 6bdim7 1dom7/5 1dom7`;
      const result = nashvilleToLetter(input, "E");
      
      // Verify it contains expected patterns
      expect(result.output).toContain("A");      // 4
      expect(result.output).toContain("E/G#");   // 1/3
      expect(result.output).toContain("B");      // 5
      expect(result.output).toContain("C#m");    // 6
      expect(result.output).toContain("Cdim7");  // 6bdim7
      expect(result.output).toContain("E7/B");   // 1dom7/5
      expect(result.output).toContain("E7");     // 1dom7
    });

    it("converts vamp with compressed digits", () => {
      const input = "(1min-2651)";
      const result = nashvilleToLetter(input, "E");
      
      expect(result.output).toContain("Em");     // 1min
      expect(result.output).toContain("F#m");    // 2
      expect(result.output).toContain("C#m");    // 6
      expect(result.output).toContain("B");      // 5
      expect(result.output).toContain("E");      // 1
    });
  });

  // ============================================================
  // Formatting Preservation
  // ============================================================
  describe("Formatting preservation", () => {
    it("preserves dashes", () => {
      const result = nashvilleToLetter("1---4-5", "E");
      expect(result.output).toBe("E---A-B");
    });

    it("preserves parentheses", () => {
      const result = nashvilleToLetter("(6-5-1)", "E");
      expect(result.output).toBe("(C#m-B-E)");
    });

    it("preserves spaces", () => {
      const result = nashvilleToLetter("6 3", "E");
      expect(result.output).toBe("C#m G#m");
    });

    it("preserves line breaks", () => {
      const input = "1\n2\n3";
      const result = nashvilleToLetter(input, "E");
      expect(result.output).toContain("\n");
    });

    it("preserves repeat indicators", () => {
      const result = nashvilleToLetter("4-1-6-5 (2x)", "E");
      expect(result.output).toContain("(2x)");
    });
  });

  // ============================================================
  // Error Handling
  // ============================================================
  describe("Error handling", () => {
    it("returns error for invalid key", () => {
      const result = nashvilleToLetter("1", "X");
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("preserves original on conversion failure", () => {
      const result = nashvilleToLetter("1", "InvalidKey");
      expect(result.output).toBe("1");
    });
  });

  // ============================================================
  // Single Chord Conversion
  // ============================================================
  describe("Single chord conversion", () => {
    it("converts a single parsed chord", () => {
      const parsed: ParsedNashvilleChord = {
        type: "chord",
        raw: "3",
        degree: 3,
        accidental: null,
        modifier: null,
        bassDegree: null,
      };
      const key = parseKey("E")!;
      const result = convertChord(parsed, key);
      expect(result.letterChord).toBe("G#m");
      expect(result.success).toBe(true);
    });

    it("converts a chord with accidental", () => {
      const parsed: ParsedNashvilleChord = {
        type: "chord",
        raw: "6b",
        degree: 6,
        accidental: "b",
        modifier: null,
        bassDegree: null,
      };
      const key = parseKey("E")!;
      const result = convertChord(parsed, key);
      expect(result.letterChord).toBe("C");
    });

    it("converts a chord with modifier", () => {
      const parsed: ParsedNashvilleChord = {
        type: "chord",
        raw: "37",
        degree: 3,
        accidental: null,
        modifier: "7",
        bassDegree: null,
      };
      const key = parseKey("E")!;
      const result = convertChord(parsed, key);
      expect(result.letterChord).toBe("G#7");
    });
  });
});

describe("Letter to Nashville Converter", () => {
  describe("Key E", () => {
    it("converts basic major chords", () => {
      expect(letterToNashville("E", "E").output).toBe("1");
      expect(letterToNashville("A", "E").output).toBe("4");
      expect(letterToNashville("B", "E").output).toBe("5");
    });

    it("converts basic minor chords", () => {
      expect(letterToNashville("F#m", "E").output).toBe("2");
      expect(letterToNashville("G#m", "E").output).toBe("3");
      expect(letterToNashville("C#m", "E").output).toBe("6");
    });

    it("converts diminished chord", () => {
      expect(letterToNashville("D#dim", "E").output).toBe("7");
    });

    it("converts chords with accidental root", () => {
      expect(letterToNashville("C", "E").output).toBe("6b");
      expect(letterToNashville("A#", "E").output).toBe("4#");
    });

    it("converts chords with explicit modifier that matches default", () => {
      expect(letterToNashville("Em", "E").output).toBe("1m");
      expect(letterToNashville("F#m", "E").output).toBe("2");
    });

    it("converts chords with non-default modifier", () => {
      expect(letterToNashville("E7", "E").output).toBe("17");
      expect(letterToNashville("Am7", "E").output).toBe("4m7");
    });

    it("converts slash chords", () => {
      expect(letterToNashville("B/F#", "E").output).toBe("5/2");
    });

    it("preserves separators between chords", () => {
      expect(letterToNashville("E A B", "E").output).toBe("1 4 5");
    });

    it("preserves dash separators", () => {
      expect(letterToNashville("E-A-B", "E").output).toBe("1-4-5");
    });
  });

  describe("Key G", () => {
    it("converts basic degrees", () => {
      expect(letterToNashville("G", "G").output).toBe("1");
      expect(letterToNashville("C", "G").output).toBe("4");
      expect(letterToNashville("D", "G").output).toBe("5");
    });

    it("converts minor chords", () => {
      expect(letterToNashville("Am", "G").output).toBe("2");
      expect(letterToNashville("Bm", "G").output).toBe("3");
      expect(letterToNashville("Em", "G").output).toBe("6");
    });
  });

  describe("Error handling", () => {
    it("returns original string for invalid key", () => {
      const result = letterToNashville("C", "XYZ");
      expect(result.output).toBe("C");
      expect(result.success).toBe(false);
    });

    it("returns original for note not in scale", () => {
      const result = letterToNashville("F", "G");
      expect(result.output).toBe("7b");
    });
  });
});
