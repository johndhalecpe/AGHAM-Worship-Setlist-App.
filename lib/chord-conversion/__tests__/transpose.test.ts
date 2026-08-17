import { describe, it, expect } from "vitest";
import { transposeLetterChords, transposeKey } from "../transpose";

describe("transposeLetterChords", () => {
  it("returns input unchanged when semitones is 0", () => {
    expect(transposeLetterChords("Am C G", 0)).toBe("Am C G");
  });

  it("transposes simple major chords up by 1 semitone", () => {
    expect(transposeLetterChords("A B C", 1)).toBe("A# C C#");
  });

  it("transposes simple major chords down by 1 semitone", () => {
    expect(transposeLetterChords("A B C", -1)).toBe("G# A# B");
  });

  it("transposes minor chords preserving modifier", () => {
    expect(transposeLetterChords("Am Dm Em", 2)).toBe("Bm Em F#m");
  });

  it("transposes 7th chords preserving modifier", () => {
    expect(transposeLetterChords("G7 C7 D7", 1)).toBe("G#7 C#7 D#7");
  });

  it("transposes slash chords shifting both root and bass", () => {
    expect(transposeLetterChords("G/B Am/C", 1)).toBe("G#/C A#m/C#");
  });

  it("wraps around from B to C", () => {
    expect(transposeLetterChords("B", 1)).toBe("C");
  });

  it("wraps around from C to B going down", () => {
    expect(transposeLetterChords("C", -1)).toBe("B");
  });

  it("handles multiple octave wrap-around", () => {
    expect(transposeLetterChords("C", 12)).toBe("C");
    expect(transposeLetterChords("C", -12)).toBe("C");
  });

  it("preserves separators between chords", () => {
    expect(transposeLetterChords("Am---C---G", 1)).toBe("A#m---C#---G#");
  });

  it("preserves newlines between chords", () => {
    expect(transposeLetterChords("Am\nC", 1)).toBe("A#m\nC#");
  });

  it("transposes maj7 modifier", () => {
    expect(transposeLetterChords("Cmaj7 Fmaj7", 1)).toBe("C#maj7 F#maj7");
  });

  it("transposes dim modifier", () => {
    expect(transposeLetterChords("Adim", 1)).toBe("A#dim");
  });

  it("transposes sus4 modifier", () => {
    expect(transposeLetterChords("Dsus4", 1)).toBe("D#sus4");
  });

  it("handles sharps in input", () => {
    expect(transposeLetterChords("F# G# A#", 1)).toBe("G A B");
  });

  it("handles flats in input", () => {
    expect(transposeLetterChords("Bb Eb Ab", 1)).toBe("B E A");
  });

  it("returns non-chord text unchanged", () => {
    expect(transposeLetterChords("No chords here", 1)).toBe("No chords here");
  });

  it("transposes mixed chord qualities", () => {
    expect(transposeLetterChords("Am7 Cmaj7 G/B D", 2)).toBe("Bm7 Dmaj7 A/C# E");
  });
});

describe("transposeKey", () => {
  it("returns input unchanged when semitones is 0", () => {
    expect(transposeKey("G", 0)).toBe("G");
  });

  it("transposes major key up", () => {
    expect(transposeKey("G", 1)).toBe("G#");
    expect(transposeKey("G", 2)).toBe("A");
  });

  it("transposes major key down", () => {
    expect(transposeKey("G", -1)).toBe("F#");
    expect(transposeKey("A", -2)).toBe("G");
  });

  it("transposes minor key preserving m suffix", () => {
    expect(transposeKey("Am", 1)).toBe("A#m");
    expect(transposeKey("Em", -1)).toBe("D#m");
  });

  it("wraps around from B to C", () => {
    expect(transposeKey("B", 1)).toBe("C");
  });

  it("wraps around from C to B going down", () => {
    expect(transposeKey("C", -1)).toBe("B");
  });

  it("handles sharp keys", () => {
    expect(transposeKey("F#", 1)).toBe("G");
    expect(transposeKey("C#", 1)).toBe("D");
  });

  it("handles flat keys", () => {
    expect(transposeKey("Bb", 1)).toBe("B");
    expect(transposeKey("Eb", -1)).toBe("D");
  });

  it("handles minor sharp keys", () => {
    expect(transposeKey("F#m", 1)).toBe("Gm");
  });

  it("full octave returns same key", () => {
    expect(transposeKey("G", 12)).toBe("G");
    expect(transposeKey("Am", -12)).toBe("Am");
  });
});
