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

const QUICK_KEYS = ["G", "E", "A", "D", "C", "F", "B"];
const TIME_SIGNATURES = ["4/4", "3/4", "6/8"];
const MIN_BPM = 40;
const MAX_BPM = 300;

function isValidKey(input: string): boolean | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  return /^[A-Ga-g][#b]?m?$/.test(trimmed);
}

export default function MusicalDataSection({
  defaultKey,
  defaultBpm,
  defaultTimeSignature,
  onKeyChange,
  onBpmChange,
  onTimeSignatureChange,
}: MusicalDataSectionProps) {
  const [selectedKey, setSelectedKey] = useState(() =>
    QUICK_KEYS.includes(defaultKey) ? defaultKey : ""
  );
  const [customKeyInput, setCustomKeyInput] = useState(() =>
    QUICK_KEYS.includes(defaultKey) ? "" : defaultKey
  );
  const [customKeyError, setCustomKeyError] = useState<string | null>(null);
  const [bpm, setBpm] = useState<number | null>(defaultBpm);
  const [bpmInput, setBpmInput] = useState(defaultBpm !== null ? String(defaultBpm) : "");
  const [timeSignature, setTimeSignature] = useState(defaultTimeSignature);
  const [bpmTouched, setBpmTouched] = useState(defaultBpm !== null);
  const [timeSigTouched, setTimeSigTouched] = useState(defaultTimeSignature !== "");

  function handleCustomKeyChange(value: string) {
    setCustomKeyInput(value);
    setSelectedKey("");

    const result = isValidKey(value);
    if (result === null) {
      setCustomKeyError(null);
    } else if (result === false) {
      setCustomKeyError("Invalid key (e.g. G, Am, F#, C#m)");
    } else {
      setCustomKeyError(null);
      onKeyChange(value.trim());
    }
  }

  function handleChipClick(key: string) {
    const next = key === selectedKey ? "" : key;
    setSelectedKey(next);
    setCustomKeyInput("");
    setCustomKeyError(null);
    onKeyChange(next);
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
    setBpmInput(value);
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= MIN_BPM && num <= MAX_BPM) {
      setBpm(num);
      setBpmTouched(true);
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
  const inputBorderColor = customKeyError
    ? "#DC2626"
    : "var(--color-border)";

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
          Key
        </label>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {QUICK_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleChipClick(k)}
              className="rounded-lg font-medium transition-all min-w-[36px] px-2 py-1.5 text-sm leading-none"
              style={{
                backgroundColor:
                  selectedKey === k ? "#D84F0B" : "var(--color-surface)",
                color:
                  selectedKey === k ? "#fff" : "var(--color-text-secondary)",
                border:
                  selectedKey === k
                    ? "1px solid #D84F0B"
                    : "1px solid var(--color-border)",
              }}
            >
              {k}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-1.5">
          <input
            type="text"
            value={customKeyInput}
            onChange={(e) => handleCustomKeyChange(e.target.value)}
            placeholder="e.g. F#, C#m, Bb"
            maxLength={5}
            className="w-28 rounded-lg px-2 py-1.5 text-sm font-mono"
            style={{
              border: `1px solid ${inputBorderColor}`,
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text)",
            }}
            onFocus={(e) => {
              if (!customKeyError) e.target.style.borderColor = "#D84F0B";
            }}
            onBlur={(e) => {
              if (!customKeyError) e.target.style.borderColor = "var(--color-border)";
            }}
          />
        </div>
        {customKeyError && (
          <p className="text-xs mt-1" style={{ color: "#DC2626" }}>
            {customKeyError}
          </p>
        )}
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
