"use client";

type ChordsViewerProps = {
  chords: string;
  editable?: boolean;
  onChange?: (value: string) => void;
};

export default function ChordsViewer({ chords, editable, onChange }: ChordsViewerProps) {
  if (editable) {
    return (
      <textarea
        value={chords}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Enter chords..."
        rows={6}
        className="w-full rounded-lg px-3 py-2 text-sm mt-1.5"
        style={{
          fontFamily: "'Courier New', Courier, monospace",
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text)",
          lineHeight: "1.75",
          whiteSpace: "pre",
          overflow: "auto hidden",
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
      />
    );
  }

  return (
    <pre
      className="w-full rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap select-text"
      style={{
        fontFamily: "'Courier New', Courier, monospace",
        backgroundColor: "var(--color-surface)",
        color: "var(--color-text)",
        border: "1px solid transparent",
        lineHeight: "1.75",
        margin: 0,
      }}
    >
      {chords || "No chords available."}
    </pre>
  );
}
