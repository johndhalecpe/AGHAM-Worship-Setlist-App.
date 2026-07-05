"use client";

import { useState } from "react";

type MusicalDataSectionProps = {
  defaultKey: string;
  defaultBpm: number | null;
  defaultTimeSignature: string;
  onKeyChange: (key: string) => void;
  onBpmChange: (bpm: number | null) => void;
  onTimeSignatureChange: (sig: string) => void;
};

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const TIME_SIGNATURES = ["4/4", "3/4", "6/8"];
const MIN_BPM = 40;
const MAX_BPM = 300;

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
  defaultBpm,
  defaultTimeSignature,
  onKeyChange,
  onBpmChange,
  onTimeSignatureChange,
}: MusicalDataSectionProps) {
  const parsed = parseKey(defaultKey);
  const [letter, setLetter] = useState(parsed.letter);
  const [accidental, setAccidental] = useState<"sharp" | "flat" | null>(parsed.accidental);
  const [isMinor, setIsMinor] = useState(parsed.isMinor);
  const [bpm, setBpm] = useState<number | null>(defaultBpm);
  const [bpmInput, setBpmInput] = useState(defaultBpm !== null ? String(defaultBpm) : "");
  const [timeSignature, setTimeSignature] = useState(defaultTimeSignature);
  const [bpmTouched, setBpmTouched] = useState(defaultBpm !== null);
  const [timeSigTouched, setTimeSigTouched] = useState(defaultTimeSignature !== "");

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

  function handleBpmDecrement() {
    const current = bpm ?? 120;
    const next = Math.max(MIN_BPM, current - 1);
    setBpm(next);
    setBpmInput(String(next));
    setBpmTouched(true);
    onBpmChange(next);
  }

  function handleBpmIncrement() {
    const current = bpm ?? 120;
    const next = Math.min(MAX_BPM, current + 1);
    setBpm(next);
    setBpmInput(String(next));
    setBpmTouched(true);
    onBpmChange(next);
  }

  function handleBpmInputChange(value: string) {
    const cleaned = value.replace(/[^0-9]/g, "");
    setBpmInput(cleaned);
    setBpmTouched(true);
    const num = parseInt(cleaned, 10);
    if (!isNaN(num) && num >= MIN_BPM && num <= MAX_BPM) {
      setBpm(num);
      onBpmChange(num);
    }
  }

  function handleBpmInputBlur(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = "var(--color-border)";
    if (bpmInput === "") {
      setBpm(null);
      return;
    }
    const num = parseInt(bpmInput, 10);
    if (isNaN(num) || num < MIN_BPM) {
      const clamped = MIN_BPM;
      setBpmInput(String(clamped));
      setBpm(clamped);
      setBpmTouched(true);
      onBpmChange(clamped);
    } else if (num > MAX_BPM) {
      const clamped = MAX_BPM;
      setBpmInput(String(clamped));
      setBpm(clamped);
      setBpmTouched(true);
      onBpmChange(clamped);
    } else {
      setBpmInput(String(num));
      setBpm(num);
      setBpmTouched(true);
      onBpmChange(num);
    }
  }

  const displayBpm = bpmTouched ? bpmInput : "";

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
          {LETTERS.map((keyLetter) => (
            <button
              key={keyLetter}
              type="button"
              onClick={() => handleLetterClick(keyLetter)}
              className="rounded-lg font-medium transition-all min-w-[36px] px-2 py-1.5 text-sm leading-none"
              style={{
                backgroundColor:
                  letter === keyLetter ? "#D84F0B" : "var(--color-surface)",
                color:
                  letter === keyLetter ? "#fff" : "var(--color-text-secondary)",
                border:
                  letter === keyLetter
                    ? "1px solid #D84F0B"
                    : "1px solid var(--color-border)",
              }}
            >
              {keyLetter}
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
                accidental === "flat" ? "#D84F0B" : "var(--color-surface)",
              color:
                accidental === "flat" ? "#fff" : "var(--color-text-secondary)",
              border:
                accidental === "flat"
                  ? "1px solid #D84F0B"
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
                accidental === "sharp" ? "#D84F0B" : "var(--color-surface)",
              color:
                accidental === "sharp" ? "#fff" : "var(--color-text-secondary)",
              border:
                accidental === "sharp"
                  ? "1px solid #D84F0B"
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
                isMinor ? "#D84F0B" : "var(--color-surface)",
              color:
                isMinor ? "#fff" : "var(--color-text-secondary)",
              border:
                isMinor
                  ? "1px solid #D84F0B"
                  : "1px solid var(--color-border)",
            }}
          >
            m
          </button>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
          BPM
        </label>
        <div className="flex items-center gap-3 mt-1.5">
          <button
            type="button"
            onClick={handleBpmDecrement}
            disabled={bpmTouched && bpm !== null && bpm <= MIN_BPM}
            className="rounded-lg w-9 h-9 flex items-center justify-center text-lg font-medium transition-all disabled:opacity-30"
            style={{
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text)",
            }}
          >
            −
          </button>
          <input
            type="text"
            name="song-bpm"
            autoComplete="off"
            value={displayBpm}
            onChange={(e) => handleBpmInputChange(e.target.value)}
            onBlur={handleBpmInputBlur}
            placeholder="--"
            className="w-16 rounded-lg px-2 py-1.5 text-lg font-semibold font-mono text-center"
            style={{
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text)",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#D84F0B")}
          />
          <button
            type="button"
            onClick={handleBpmIncrement}
            disabled={bpmTouched && bpm !== null && bpm >= MAX_BPM}
            className="rounded-lg w-9 h-9 flex items-center justify-center text-lg font-medium transition-all disabled:opacity-30"
            style={{
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text)",
            }}
          >
            +
          </button>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
          Time Signature
        </label>
        <div className="flex gap-2 mt-1.5">
          {TIME_SIGNATURES.map((ts) => (
            <button
              key={ts}
              type="button"
              onClick={() => {
                const next = ts === timeSignature ? "" : ts;
                setTimeSignature(next);
                setTimeSigTouched(true);
                onTimeSignatureChange(next);
              }}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-all flex-1"
              style={{
                backgroundColor:
                  timeSignature === ts ? "#D84F0B" : "var(--color-surface)",
                color:
                  timeSignature === ts ? "#fff" : "var(--color-text-secondary)",
                border:
                  timeSignature === ts
                    ? "1px solid #D84F0B"
                    : "1px solid var(--color-border)",
              }}
            >
              {ts}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
