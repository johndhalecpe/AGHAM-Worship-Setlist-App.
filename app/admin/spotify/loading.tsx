export default function AdminSpotifyLoading() {
  return (
    <div className="animate-pulse max-w-lg">
      <div className="h-7 w-48 rounded-lg mb-6" style={{ backgroundColor: "var(--color-surface-muted)" }} />
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: "var(--color-surface-card)" }}
      >
        <div className="h-5 w-3/5 rounded mb-3" style={{ backgroundColor: "var(--color-surface-muted)" }} />
        <div className="h-4 w-2/5 rounded" style={{ backgroundColor: "var(--color-surface-muted)" }} />
      </div>
    </div>
  );
}
