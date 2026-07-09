export default function SongsLoading() {
  return (
    <div>
      <div className="h-8 w-48 rounded-lg mb-6" style={{ backgroundColor: "var(--color-surface-muted)" }} />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg py-3 px-4 animate-pulse"
            style={{ backgroundColor: "var(--color-surface-card)" }}
          >
            <div className="h-4 w-3/5 rounded mb-2" style={{ backgroundColor: "var(--color-surface-muted)" }} />
            <div className="h-3 w-1/4 rounded" style={{ backgroundColor: "var(--color-surface-muted)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
