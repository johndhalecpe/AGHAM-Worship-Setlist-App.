"use client";

import { useState, useRef, useEffect } from "react";

const QUICK_KEYS = ["G", "E", "A", "D", "C", "F", "B"];

type KeyPickerProps = {
  value: string;
  onChange: (key: string) => void;
  placeholder?: string;
};

export default function KeyPicker({
  value,
  onChange,
  placeholder = "Enter key if not listed...",
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
    <div ref={ref} className="relative">
      <input
        type="text"
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
        className="w-full rounded-lg px-3 py-2 text-sm"
        style={{
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text)",
        }}
      />
      {open && (
        <div
          className="absolute z-20 mt-1 rounded-xl p-2 w-full"
          style={{
            backgroundColor: "var(--color-surface-card)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <div className="grid grid-cols-4 gap-1.5">
            {QUICK_KEYS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => handleSelect(k)}
                className="rounded-lg px-3 py-2 text-sm font-medium transition-all text-center min-h-[40px]"
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
          <p
            className="text-xs mt-2 text-center"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Tap a key above or type your own
          </p>
        </div>
      )}
    </div>
  );
}
