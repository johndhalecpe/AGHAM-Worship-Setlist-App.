export default function SetlistDetailLoading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: "var(--color-surface-card)" }}
      >
        <div className="h-7 w-1/3 rounded mb-2" style={{ backgroundColor: "var(--color-surface-muted)" }} />
        <div className="h-4 w-1/4 rounded mb-4" style={{ backgroundColor: "var(--color-surface-muted)" }} />
        <div className="h-4 w-1/6 rounded" style={{ backgroundColor: "var(--color-surface-muted)" }} />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl p-5"
          style={{ backgroundColor: "var(--color-surface-card)" }}
        >
          <div className="h-5 w-1/4 rounded mb-3" style={{ backgroundColor: "var(--color-surface-muted)" }} />
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} className="h-4 w-3/5 rounded mb-2" style={{ backgroundColor: "var(--color-surface-muted)" }} />
          ))}
        </div>
      ))}
    </div>
  );
}
