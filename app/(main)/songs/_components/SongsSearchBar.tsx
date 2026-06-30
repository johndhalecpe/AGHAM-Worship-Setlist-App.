"use client";

import { useRef } from "react";

type SongsSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SongsSearchBar({ value, onChange }: SongsSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const borderRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={borderRef}
      className="rounded-xl flex items-center gap-2 px-3 sm:px-4 transition-all"
      style={{
        backgroundColor: "var(--color-surface-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-5 h-5 shrink-0"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        <path
          fillRule="evenodd"
          d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
          clipRule="evenodd"
        />
      </svg>
      <input
        ref={inputRef}
        type="text"
        name="songs-search"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by title, author, or lyrics..."
        className="w-full py-2.5 sm:py-3 text-sm bg-transparent outline-none min-h-[44px]"
        style={{ color: "var(--color-text)" }}
        onFocus={() => {
          if (borderRef.current) {
            borderRef.current.style.borderColor = "#D84F0B";
          }
        }}
        onBlur={() => {
          if (borderRef.current) {
            borderRef.current.style.borderColor = "var(--color-border)";
          }
        }}
      />
      {value && (
        <button
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className="p-1.5 rounded transition-colors hover:opacity-80 min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0"
          style={{ color: "var(--color-text-tertiary)" }}
          aria-label="Clear search"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      )}
    </div>
  );
}
