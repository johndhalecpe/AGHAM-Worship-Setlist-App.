import { describe, it, expect } from "vitest";
import { parseLetterChord, looksLikeLetterChord } from "../letter-parser";

describe("parseLetterChord", () => {
  describe("Basic major chords", () => {
    it("parses bare major chord C", () => {
      const result = parseLetterChord("C");
      expect(result).toEqual({
        rootLetter: "C",
        rootAccidental: null,
        modifier: null,
        bassLetter: null,
        bassAccidental: null,
        raw: "C",
      });
    });

    it("parses bare major chord G", () => {
      const result = parseLetterChord("G");
      expect(result?.rootLetter).toBe("G");
      expect(result?.modifier).toBeNull();
    });

    it("parses all root notes", () => {
      for (const note of ["C", "D", "E", "F", "G", "A", "B"]) {
        const result = parseLetterChord(note);
        expect(result?.rootLetter).toBe(note);
      }
    });
  });

  describe("Root with accidental", () => {
    it("parses sharp root F#", () => {
      const result = parseLetterChord("F#");
      expect(result?.rootLetter).toBe("F");
      expect(result?.rootAccidental).toBe("#");
    });

    it("parses flat root Bb", () => {
      const result = parseLetterChord("Bb");
      expect(result?.rootLetter).toBe("B");
      expect(result?.rootAccidental).toBe("b");
    });

    it("parses sharp root C#", () => {
      const result = parseLetterChord("C#");
      expect(result?.rootLetter).toBe("C");
      expect(result?.rootAccidental).toBe("#");
    });
  });

  describe("Modifiers", () => {
    it("parses minor chord Dm", () => {
      const result = parseLetterChord("Dm");
      expect(result?.rootLetter).toBe("D");
      expect(result?.modifier).toBe("m");
    });

    it("parses minor chord with alias Dmin", () => {
      const result = parseLetterChord("Dmin");
      expect(result?.modifier).toBe("min");
    });

    it("parses dominant 7th G7", () => {
      const result = parseLetterChord("G7");
      expect(result?.modifier).toBe("7");
    });

    it("parses major 7th Cmaj7", () => {
      const result = parseLetterChord("Cmaj7");
      expect(result?.modifier).toBe("maj7");
    });

    it("parses diminished F#dim", () => {
      const result = parseLetterChord("F#dim");
      expect(result?.rootLetter).toBe("F");
      expect(result?.rootAccidental).toBe("#");
      expect(result?.modifier).toBe("dim");
    });

    it("parses diminished 7th Edim7", () => {
      const result = parseLetterChord("Edim7");
      expect(result?.modifier).toBe("dim7");
    });

    it("parses suspended 4th Asus4", () => {
      const result = parseLetterChord("Asus4");
      expect(result?.modifier).toBe("sus4");
    });

    it("parses suspended 2nd Bsus2", () => {
      const result = parseLetterChord("Bsus2");
      expect(result?.modifier).toBe("sus2");
    });

    it("parses add9 Cadd9", () => {
      const result = parseLetterChord("Cadd9");
      expect(result?.modifier).toBe("add9");
    });

    it("parses 6th chord A6", () => {
      const result = parseLetterChord("A6");
      expect(result?.modifier).toBe("6");
    });

    it("parses 9th chord E9", () => {
      const result = parseLetterChord("E9");
      expect(result?.modifier).toBe("9");
    });

    it("parses minor with accidental F#m", () => {
      const result = parseLetterChord("F#m");
      expect(result?.rootLetter).toBe("F");
      expect(result?.rootAccidental).toBe("#");
      expect(result?.modifier).toBe("m");
    });
  });

  describe("Slash chords", () => {
    it("parses simple slash chord G/B", () => {
      const result = parseLetterChord("G/B");
      expect(result?.rootLetter).toBe("G");
      expect(result?.bassLetter).toBe("B");
      expect(result?.bassAccidental).toBeNull();
    });

    it("parses slash chord with bass accidental C/G#", () => {
      const result = parseLetterChord("C/G#");
      expect(result?.rootLetter).toBe("C");
      expect(result?.bassLetter).toBe("G");
      expect(result?.bassAccidental).toBe("#");
    });

    it("parses slash chord with flat bass Dm/Bb", () => {
      const result = parseLetterChord("Dm/Bb");
      expect(result?.rootLetter).toBe("D");
      expect(result?.modifier).toBe("m");
      expect(result?.bassLetter).toBe("B");
      expect(result?.bassAccidental).toBe("b");
    });

    it("parses complex slash chord F#m7/C#", () => {
      const result = parseLetterChord("F#m7/C#");
      expect(result?.rootLetter).toBe("F");
      expect(result?.rootAccidental).toBe("#");
      expect(result?.modifier).toBe("m7");
      expect(result?.bassLetter).toBe("C");
      expect(result?.bassAccidental).toBe("#");
    });
  });

  describe("Invalid input", () => {
    it("returns null for empty string", () => {
      expect(parseLetterChord("")).toBeNull();
    });

    it("returns null for non-note start", () => {
      expect(parseLetterChord("123")).toBeNull();
    });

    it("returns null for invalid root letter", () => {
      expect(parseLetterChord("H")).toBeNull();
    });
  });

  describe("Raw preservation", () => {
    it("preserves original input as raw", () => {
      const result = parseLetterChord("F#m7/C#");
      expect(result?.raw).toBe("F#m7/C#");
    });
  });
});

describe("looksLikeLetterChord", () => {
  it("returns true for single note letter", () => {
    expect(looksLikeLetterChord("C")).toBe(true);
  });

  it("returns true for chord with accidental", () => {
    expect(looksLikeLetterChord("F#")).toBe(true);
  });

  it("returns true for chord with modifier", () => {
    expect(looksLikeLetterChord("Dm")).toBe(true);
  });

  it("returns true for slash chord", () => {
    expect(looksLikeLetterChord("G/B")).toBe(true);
  });

  it("returns false for empty string", () => {
    expect(looksLikeLetterChord("")).toBe(false);
  });

  it("returns false for Nashville digit", () => {
    expect(looksLikeLetterChord("1")).toBe(false);
  });

  it("returns false for text", () => {
    expect(looksLikeLetterChord("hello")).toBe(false);
  });
});
