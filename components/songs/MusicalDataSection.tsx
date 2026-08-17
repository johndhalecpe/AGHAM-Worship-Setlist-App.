"use client";

import { useState } from "react";

type MusicalDataSectionProps = {
  defaultKey: string;
  onKeyChange: (key: string) => void;
};

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const VALID_KEYS = new Set([
  "C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B",
  "Cm", "C#m", "Dbm", "Dm", "D#m", "Ebm", "Em", "Fm", "F#m", "Gbm", "Gm", "G#m", "Abm", "Am", "A#m", "Bbm", "Bm",
]);

const CANT_SHARP = new Set(["B", "E"]);
const CANT_FLAT = new Set(["C", "F"]);

function parseKey(key: string) {
  if (!key) return { letter: "", accidental: null as ("sharp" | "flat" | null), isMinor: false };
  let rest = key;
  const isMinor = rest.endsWith("m");
  if (isMinor) rest = rest.slice(0, -1);
  let accidental: "sharp" | "flat" | null = null;
  if (rest.endsWith("#")) { accidental = "sharp"; rest = rest.slice(0, -1); }
  else if (rest.endsWith("b")) { accidental = "flat"; rest = rest.slice(0, -1); }
  return { letter: rest, accidental, isMinor };
}

function buildKey(letter: string, accidental: "sharp" | "flat" | null, isMinor: boolean) {
  if (!letter) return "";
  return letter + (accidental === "sharp" ? "#" : accidental === "flat" ? "b" : "") + (isMinor ? "m" : "");
}

export default function MusicalDataSection({
  defaultKey,
  onKeyChange,
}: MusicalDataSectionProps) {
  const parsed = parseKey(defaultKey);
  const [letter, setLetter] = useState(parsed.letter);
  const [accidental, setAccidental] = useState<"sharp" | "flat" | null>(parsed.accidental);
  const [isMinor, setIsMinor] = useState(parsed.isMinor);

  const displayKey = buildKey(letter, accidental, isMinor);

  function commitKey(l: string, acc: "sharp" | "flat" | null, minor: boolean) {
    const key = buildKey(l, acc, minor);
    if (!key || VALID_KEYS.has(key)) {
      onKeyChange(key);
    }
  }

  function handleLetterClick(l: string) {
    if (letter === l) {
      setLetter("");
      setAccidental(null);
      setIsMinor(false);
      onKeyChange("");
      return;
    }
    const newAcc = accidental === "sharp" && CANT_SHARP.has(l) ? null
      : accidental === "flat" && CANT_FLAT.has(l) ? null
      : accidental;
    const candidate = buildKey(l, newAcc, isMinor);
    const minor = candidate && !VALID_KEYS.has(candidate) && VALID_KEYS.has(buildKey(l, newAcc, false)) ? false : isMinor;
    setLetter(l);
    setAccidental(newAcc);
    setIsMinor(minor);
    commitKey(l, newAcc, minor);
  }

  function handleAccidentalClick(type: "sharp" | "flat") {
    if (type === "sharp" && CANT_SHARP.has(letter)) return;
    if (type === "flat" && CANT_FLAT.has(letter)) return;
    if (accidental === type) {
      setAccidental(null);
      commitKey(letter, null, isMinor);
      return;
    }
    setAccidental(type);
    commitKey(letter, type, isMinor);
  }

  function handleMinorToggle() {
    const next = !isMinor;
    const candidate = buildKey(letter, accidental, next);
    if (candidate && !VALID_KEYS.has(candidate)) return;
    setIsMinor(next);
    commitKey(letter, accidental, next);
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
            Key
          </label>
          <span
            className="font-mono text-sm font-semibold"
            style={{ color: displayKey ? "var(--color-accent)" : "var(--color-text-tertiary)" }}
          >
            {displayKey || "−"}
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {LETTERS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => handleLetterClick(l)}
              className="rounded-lg font-medium transition-all min-w-[36px] px-2 py-1.5 text-sm leading-none"
              style={{
                backgroundColor:
                  letter === l ? "var(--color-accent)" : "var(--color-surface)",
                color:
                  letter === l ? "#fff" : "var(--color-text-secondary)",
                border:
                  letter === l
                    ? "1px solid var(--color-accent)"
                    : "1px solid var(--color-border)",
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={() => handleAccidentalClick("flat")}
            disabled={!letter || CANT_FLAT.has(letter)}
            className="rounded-lg min-w-[40px] px-3 py-1.5 text-base font-medium transition-all disabled:opacity-30"
            style={{
              backgroundColor:
                accidental === "flat" ? "var(--color-accent)" : "var(--color-surface)",
              color:
                accidental === "flat" ? "#fff" : "var(--color-text-secondary)",
              border:
                accidental === "flat"
                  ? "1px solid var(--color-accent)"
                  : "1px solid var(--color-border)",
            }}
          >
            ♭
          </button>
          <button
            type="button"
            onClick={() => handleAccidentalClick("sharp")}
            disabled={!letter || CANT_SHARP.has(letter)}
            className="rounded-lg min-w-[40px] px-3 py-1.5 text-base font-medium transition-all disabled:opacity-30"
            style={{
              backgroundColor:
                accidental === "sharp" ? "var(--color-accent)" : "var(--color-surface)",
              color:
                accidental === "sharp" ? "#fff" : "var(--color-text-secondary)",
              border:
                accidental === "sharp"
                  ? "1px solid var(--color-accent)"
                  : "1px solid var(--color-border)",
            }}
          >
            ♯
          </button>
          <span className="mx-1" style={{ color: "var(--color-text-tertiary)" }}>/</span>
          <button
            type="button"
            onClick={handleMinorToggle}
            disabled={!letter}
            className="rounded-lg min-w-[40px] px-3 py-1.5 text-base font-medium transition-all disabled:opacity-30"
            style={{
              backgroundColor:
                isMinor ? "var(--color-accent)" : "var(--color-surface)",
              color:
                isMinor ? "#fff" : "var(--color-text-secondary)",
              border:
                isMinor
                  ? "1px solid var(--color-accent)"
                  : "1px solid var(--color-border)",
            }}
          >
            m
          </button>
        </div>
      </div>
    </div>
  );
}
