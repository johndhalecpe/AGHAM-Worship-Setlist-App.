"use client";

import { useState, useRef, useEffect } from "react";

const QUICK_KEYS = ["G", "E", "A", "D", "C", "F", "B"];

type KeyPickerProps = {
  value: string;
  onChange: (key: string) => void;
  onCancel?: () => void;
  placeholder?: string;
};

export default function KeyPicker({
  value,
  onChange,
  onCancel,
  placeholder = "Key...",
}: KeyPickerProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(key: string) {
    onChange(key);
    setInputValue(key);
    setOpen(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
  }

  return (
    <div ref={ref} className="relative inline-flex items-center gap-0">
      <input
        type="text"
        name="key-picker"
        autoComplete="off"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={(e) => {
          setOpen(true);
          e.target.style.borderColor = "#D84F0B";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "var(--color-border)";
        }}
        placeholder={placeholder}
        maxLength={3}
        className="w-24 rounded-lg px-2 py-1.5 text-sm font-mono"
        style={{
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text)",
        }}
      />
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="ml-1 rounded p-1 leading-none transition-colors hover:opacity-80 shrink-0 min-h-[28px] min-w-[28px] flex items-center justify-center"
          style={{ color: "var(--color-text-tertiary)" }}
          aria-label="Cancel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      )}
      {open && (
        <div
          className="absolute z-20 mt-1 rounded-xl p-2 w-full"
          style={{
            backgroundColor: "var(--color-surface-card)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <div className="flex flex-wrap justify-center gap-1.5">
            {QUICK_KEYS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => handleSelect(k)}
                className="rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all text-center min-w-[36px]"
                style={{
                  backgroundColor:
                    value === k ? "#D84F0B" : "var(--color-surface)",
                  color:
                    value === k ? "#fff" : "var(--color-text-secondary)",
                  border:
                    value === k
                      ? "1px solid #D84F0B"
                      : "1px solid var(--color-border)",
                }}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
