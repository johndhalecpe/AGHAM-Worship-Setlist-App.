"use client";

import { useState } from "react";

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const CANT_SHARP = new Set(["B", "E"]);
const CANT_FLAT = new Set(["C", "F"]);

const VALID_KEYS = new Set([
  "C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B",
  "Cm", "C#m", "Dbm", "Dm", "D#m", "Ebm", "Em", "Fm", "F#m", "Gbm", "Gm", "G#m", "Abm", "Am", "A#m", "Bbm", "Bm",
]);

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

type KeyPickerProps = {
  value: string;
  onChange: (key: string) => void;
  onCancel?: () => void;
};

export default function KeyPicker({
  value,
  onChange,
  onCancel,
}: KeyPickerProps) {
  const initial = parseKey(value);
  const [letter, setLetter] = useState(initial.letter);
  const [accidental, setAccidental] = useState<"sharp" | "flat" | null>(initial.accidental);
  const [isMinor, setIsMinor] = useState(initial.isMinor);

  const displayKey = buildKey(letter, accidental, isMinor);
  const hasChanges = displayKey !== value;

  function handleLetterClick(l: string) {
    if (letter === l) {
      setLetter("");
      setAccidental(null);
      setIsMinor(false);
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
  }

  function handleAccidentalClick(type: "sharp" | "flat") {
    if (type === "sharp" && CANT_SHARP.has(letter)) return;
    if (type === "flat" && CANT_FLAT.has(letter)) return;
    setAccidental(accidental === type ? null : type);
  }

  function handleMinorToggle() {
    const candidate = buildKey(letter, accidental, !isMinor);
    if (candidate && !VALID_KEYS.has(candidate)) return;
    setIsMinor(!isMinor);
  }

  function handleSave() {
    onChange(displayKey);
  }

  return (
    <div className="inline-flex items-start gap-2">
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap gap-1">
          {LETTERS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => handleLetterClick(l)}
              className="rounded-lg font-medium transition-all min-w-[32px] px-1.5 py-2.5 sm:py-1 text-xs leading-none"
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
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleAccidentalClick("flat")}
            disabled={!letter || CANT_FLAT.has(letter)}
            className="rounded-lg min-w-[32px] px-2 py-2.5 sm:py-1 text-xs font-medium transition-all disabled:opacity-30"
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
            className="rounded-lg min-w-[32px] px-2 py-2.5 sm:py-1 text-xs font-medium transition-all disabled:opacity-30"
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
          <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>/</span>
          <button
            type="button"
            onClick={handleMinorToggle}
            disabled={!letter}
            className="rounded-lg min-w-[32px] px-2 py-1 text-xs font-medium transition-all disabled:opacity-30"
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
          {displayKey && (
            <span className="text-xs font-mono font-semibold ml-1" style={{ color: "var(--color-accent)" }}>
              {displayKey}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges}
          className="rounded p-1 leading-none transition-colors hover:opacity-80 shrink-0 min-h-[44px] min-w-[44px] sm:min-h-[28px] sm:min-w-[28px] flex items-center justify-center disabled:opacity-30"
          style={{ color: hasChanges ? "var(--color-accent)" : "var(--color-text-tertiary)" }}
          aria-label="Save"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
          </svg>
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded p-1 leading-none transition-colors hover:opacity-80 shrink-0 min-h-[44px] min-w-[44px] sm:min-h-[28px] sm:min-w-[28px] flex items-center justify-center"
            style={{ color: "var(--color-text-tertiary)" }}
            aria-label="Cancel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
