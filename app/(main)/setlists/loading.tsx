export default function SetlistsLoading() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl p-4 animate-pulse"
          style={{ backgroundColor: "var(--color-surface-card)" }}
        >
          <div className="h-5 w-2/5 rounded mb-2" style={{ backgroundColor: "var(--color-surface-muted)" }} />
          <div className="h-3 w-1/3 rounded mb-3" style={{ backgroundColor: "var(--color-surface-muted)" }} />
          <div className="h-3 w-1/4 rounded" style={{ backgroundColor: "var(--color-surface-muted)" }} />
        </div>
      ))}
    </div>
  );
}
