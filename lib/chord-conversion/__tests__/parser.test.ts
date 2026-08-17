// ============================================================
// Parser Tests
// ============================================================

import { describe, it, expect } from "vitest";
import { parseNashville, extractChords } from "../parser";
import type { ParsedNashvilleChord } from "../types";

describe("Nashville Parser", () => {
  // ============================================================
  // Basic Degree Tests
  // ============================================================
  describe("Basic degrees", () => {
    it("parses single degree 1", () => {
      const result = parseNashville("1");
      const chords = extractChords(result);
      expect(chords).toHaveLength(1);
      expect(chords[0].degree).toBe(1);
      expect(chords[0].accidental).toBeNull();
      expect(chords[0].modifier).toBeNull();
    });

    it("parses single degree 2", () => {
      const result = parseNashville("2");
      const chords = extractChords(result);
      expect(chords).toHaveLength(1);
      expect(chords[0].degree).toBe(2);
    });

    it("parses single degree 3", () => {
      const result = parseNashville("3");
      const chords = extractChords(result);
      expect(chords).toHaveLength(1);
      expect(chords[0].degree).toBe(3);
    });

    it("parses single degree 4", () => {
      const result = parseNashville("4");
      const chords = extractChords(result);
      expect(chords).toHaveLength(1);
      expect(chords[0].degree).toBe(4);
    });

    it("parses single degree 5", () => {
      const result = parseNashville("5");
      const chords = extractChords(result);
      expect(chords).toHaveLength(1);
      expect(chords[0].degree).toBe(5);
    });

    it("parses single degree 6", () => {
      const result = parseNashville("6");
      const chords = extractChords(result);
      expect(chords).toHaveLength(1);
      expect(chords[0].degree).toBe(6);
    });

    it("parses single degree 7", () => {
      const result = parseNashville("7");
      const chords = extractChords(result);
      expect(chords).toHaveLength(1);
      expect(chords[0].degree).toBe(7);
    });
  });

  // ============================================================
  // Accidental Tests
  // ============================================================
  describe("Accidentals", () => {
    it("parses 6b (flat accidental)", () => {
      const result = parseNashville("6b");
      const chords = extractChords(result);
      expect(chords).toHaveLength(1);
      expect(chords[0].degree).toBe(6);
      expect(chords[0].accidental).toBe("b");
      expect(chords[0].modifier).toBeNull();
    });

    it("parses 4# (sharp accidental)", () => {
      const result = parseNashville("4#");
      const chords = extractChords(result);
      expect(chords).toHaveLength(1);
      expect(chords[0].degree).toBe(4);
      expect(chords[0].accidental).toBe("#");
      expect(chords[0].modifier).toBeNull();
    });

    it("parses 7b (flat on degree 7)", () => {
      const result = parseNashville("7b");
      const chords = extractChords(result);
      expect(chords).toHaveLength(1);
      expect(chords[0].degree).toBe(7);
      expect(chords[0].accidental).toBe("b");
    });

    it("parses 2b (flat on degree 2)", () => {
      const result = parseNashville("2b");
      const chords = extractChords(result);
      expect(chords).toHaveLength(1);
      expect(chords[0].degree).toBe(2);
      expect(chords[0].accidental).toBe("b");
    });

    it("parses 5# (sharp on degree 5)", () => {
      const result = parseNashville("5#");
      const chords = extractChords(result);
      expect(chords).toHaveLength(1);
      expect(chords[0].degree).toBe(5);
      expect(chords[0].accidental).toBe("#");
    });
  });

  // ============================================================
  // Modifier Tests
  // ============================================================
  describe("Modifiers", () => {
    it("parses 37 as degree 3 + modifier 7", () => {
      const result = parseNashville("37");
      const chords = extractChords(result);
      expect(chords).toHaveLength(1);
      expect(chords[0].degree).toBe(3);
      expect(chords[0].modifier).toBe("7");
      expect(chords[0].accidental).toBeNull();
    });

    it("parses 57 as degree 5 + modifier 7", () => {
      const result = parseNashville("57");
      const chords = extractChords(result);
      expect(chords).toHaveLength(1);
      expect(chords[0].degree).toBe(5);
      expect(chords[0].modifier).toBe("7");
    });

    it("parses 4m as degree 4 + modifier m", () => {
      const result = parseNashville("4m");
      const chords = extractChords(result);
      expect(chords).toHaveLength(1);
      expect(chords[0].degree).toBe(4);
      expect(chords[0].modifier).toBe("m");
    });

    it("parses 5m as degree 5 + modifier m", () => {
      const result = parseNashville("5m");
      const chords = extractChords(result);
      expect(chords).toHaveLength(1);
      expect(chords[0].degree).toBe(5);
      expect(chords[0].modifier).toBe("m");
    });

    it("parses 1min as degree 1 + modifier min", () => {
      const result = parseNashville("1min");
      const chords = extractChords(result);
      expect(chords).toHaveLength(1);
      expect(chords[0].degree).toBe(1);
      expect(chords[0].modifier).toBe("min");
    });

    it("parses 6bdim7 as degree 6 + accidental b + modifier dim7", () => {
      const result = parseNashville("6bdim7");
      const chords = extractChords(result);
      expect(chords).toHaveLength(1);
      expect(chords[0].degree).toBe(6);
      expect(chords[0].accidental).toBe("b");
      expect(chords[0].modifier).toBe("dim7");
    });

    it("parses 1dom7 as degree 1 + modifier dom7", () => {
      const result = parseNashville("1dom7");
      const chords = extractChords(result);
      expect(chords).toHaveLength(1);
      expect(chords[0].degree).toBe(1);
      expect(chords[0].modifier).toBe("dom7");
    });
  });

  // ============================================================
  // Boundary Tests (Critical!)
  // ============================================================
  describe("Chord boundaries", () => {
    it("parses 37 as ONE chord (degree + modifier)", () => {
      const result = parseNashville("37");
      const chords = extractChords(result);
      expect(chords).toHaveLength(1);
      expect(chords[0].degree).toBe(3);
      expect(chords[0].modifier).toBe("7");
    });

    it("parses 3-7 as TWO chords", () => {
      const result = parseNashville("3-7");
      const chords = extractChords(result);
      expect(chords).toHaveLength(2);
      expect(chords[0].degree).toBe(3);
      expect(chords[0].modifier).toBeNull();
      expect(chords[1].degree).toBe(7);
      expect(chords[1].modifier).toBeNull();
    });

    it("parses 3 7 as TWO chords (space separated)", () => {
      const result = parseNashville("3 7");
      const chords = extractChords(result);
      expect(chords).toHaveLength(2);
      expect(chords[0].degree).toBe(3);
      expect(chords[1].degree).toBe(7);
    });

    it("parses 51 as TWO separate chords (not modifier)", () => {
      const result = parseNashville("51");
      const chords = extractChords(result);
      expect(chords).toHaveLength(2);
      expect(chords[0].degree).toBe(5);
      expect(chords[1].degree).toBe(1);
    });

    it("parses 2651 as FOUR separate chords", () => {
      const result = parseNashville("2651");
      const chords = extractChords(result);
      expect(chords).toHaveLength(4);
      expect(chords[0].degree).toBe(2);
      expect(chords[1].degree).toBe(6);
      expect(chords[2].degree).toBe(5);
      expect(chords[3].degree).toBe(1);
    });

    it("parses 251 as THREE separate chords", () => {
      const result = parseNashville("251");
      const chords = extractChords(result);
      expect(chords).toHaveLength(3);
      expect(chords[0].degree).toBe(2);
      expect(chords[1].degree).toBe(5);
      expect(chords[2].degree).toBe(1);
    });

    it("parses 3456 as FOUR separate chords", () => {
      const result = parseNashville("3456");
      const chords = extractChords(result);
      expect(chords).toHaveLength(4);
      expect(chords[0].degree).toBe(3);
      expect(chords[1].degree).toBe(4);
      expect(chords[2].degree).toBe(5);
      expect(chords[3].degree).toBe(6);
    });
  });

  // ============================================================
  // Separator Tests
  // ============================================================
  describe("Separators", () => {
    it("preserves dashes", () => {
      const result = parseNashville("1-2-3");
      expect(result.tokens).toHaveLength(5); // 1, -, 2, -, 3
      const separator = result.tokens[1];
      if (separator.type === "separator") {
        expect(separator.value).toBe("-");
      } else {
        throw new Error("Expected separator token");
      }
    });

    it("preserves multiple dashes", () => {
      const result = parseNashville("1---4-5");
      const chords = extractChords(result);
      expect(chords).toHaveLength(3);
      expect(chords[0].degree).toBe(1);
      expect(chords[1].degree).toBe(4);
      expect(chords[2].degree).toBe(5);
    });

    it("preserves spaces", () => {
      const result = parseNashville("1 2 3");
      const chords = extractChords(result);
      expect(chords).toHaveLength(3);
    });
  });

  // ============================================================
  // Parentheses and Brackets Tests
  // ============================================================
  describe("Structural characters", () => {
    it("preserves parentheses", () => {
      const result = parseNashville("(6-5-1)");
      expect(result.tokens[0].type).toBe("parenthesis_open");
      expect(result.tokens[6].type).toBe("parenthesis_close");
    });

    it("preserves brackets", () => {
      const result = parseNashville("[Em Em G]");
      expect(result.tokens[0].type).toBe("bracket_open");
      expect(result.tokens[result.tokens.length - 1].type).toBe("bracket_close");
    });

    it("parses chords inside parentheses", () => {
      const result = parseNashville("(6-5-1)");
      const chords = extractChords(result);
      expect(chords).toHaveLength(3);
      expect(chords[0].degree).toBe(6);
      expect(chords[1].degree).toBe(5);
      expect(chords[2].degree).toBe(1);
    });
  });

  // ============================================================
  // Repeat Indicator Tests
  // ============================================================
  describe("Repeat indicators", () => {
    it("preserves (2x) repeat", () => {
      const result = parseNashville("4-1-6-5 (2x)");
      const repeats = result.tokens.filter((t) => t.type === "repeat");
      expect(repeats).toHaveLength(1);
      expect(repeats[0].value).toBe("(2x)");
    });

    it("preserves (4x) repeat", () => {
      const result = parseNashville("(4x)");
      const repeats = result.tokens.filter((t) => t.type === "repeat");
      expect(repeats).toHaveLength(1);
      expect(repeats[0].value).toBe("(4x)");
    });
  });

  // ============================================================
  // Slash Chord Tests
  // ============================================================
  describe("Slash chords", () => {
    it("parses 1/3 as degree 1 with bass degree 3", () => {
      const result = parseNashville("1/3");
      const chords = extractChords(result);
      expect(chords).toHaveLength(1);
      expect(chords[0].degree).toBe(1);
      expect(chords[0].bassDegree).toBe(3);
    });

    it("parses 5/7 as degree 5 with bass degree 7", () => {
      const result = parseNashville("5/7");
      const chords = extractChords(result);
      expect(chords).toHaveLength(1);
      expect(chords[0].degree).toBe(5);
      expect(chords[0].bassDegree).toBe(7);
    });

    it("parses 1dom7/5 as degree 1 + dom7 with bass degree 5", () => {
      const result = parseNashville("1dom7/5");
      const chords = extractChords(result);
      expect(chords).toHaveLength(1);
      expect(chords[0].degree).toBe(1);
      expect(chords[0].modifier).toBe("dom7");
      expect(chords[0].bassDegree).toBe(5);
    });
  });

  // ============================================================
  // Real-World Examples
  // ============================================================
  describe("Real-world examples", () => {
    it("parses Agnus Dei example", () => {
      const input = `1---4-5
4-2
6 3
(6-2-6-3)-4`;
      const result = parseNashville(input);
      const chords = extractChords(result);
      expect(chords).toHaveLength(12);
      expect(result.success).toBe(true);
    });

    it("parses complex song with modifiers", () => {
      const input = `1dom7 -4dom7
5-4-5
1-4-6-5`;
      const result = parseNashville(input);
      const chords = extractChords(result);
      expect(chords).toHaveLength(9);
      expect(chords[0].modifier).toBe("dom7");
      expect(chords[1].modifier).toBe("dom7");
    });

    it("parses song with slash chords", () => {
      const input = `4 1/3 5 6 6bdim7 1dom7/5 1dom7`;
      const result = parseNashville(input);
      const chords = extractChords(result);
      expect(chords).toHaveLength(7);
      expect(chords[1].bassDegree).toBe(3);
      expect(chords[5].bassDegree).toBe(5);
    });

    it("parses vamp with compressed digits", () => {
      const input = "(1min-2651)";
      const result = parseNashville(input);
      const chords = extractChords(result);
      expect(chords).toHaveLength(5); // 1min, 2, 6, 5, 1
      expect(chords[0].modifier).toBe("min");
      expect(chords[1].degree).toBe(2);
      expect(chords[2].degree).toBe(6);
      expect(chords[3].degree).toBe(5);
      expect(chords[4].degree).toBe(1);
    });
  });

  // ============================================================
  // Raw String Preservation
  // ============================================================
  describe("Raw string preservation", () => {
    it("preserves raw string for degree 1", () => {
      const result = parseNashville("1");
      const chords = extractChords(result);
      expect(chords[0].raw).toBe("1");
    });

    it("preserves raw string for 6b", () => {
      const result = parseNashville("6b");
      const chords = extractChords(result);
      expect(chords[0].raw).toBe("6b");
    });

    it("preserves raw string for 37", () => {
      const result = parseNashville("37");
      const chords = extractChords(result);
      expect(chords[0].raw).toBe("37");
    });

    it("preserves raw string for 1dom7/5", () => {
      const result = parseNashville("1dom7/5");
      const chords = extractChords(result);
      expect(chords[0].raw).toBe("1dom7/5");
    });
  });
});
