export default function AdminUsersLoading() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="h-7 w-36 rounded-lg mb-6" style={{ backgroundColor: "var(--color-surface-muted)" }} />
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl p-4"
          style={{ backgroundColor: "var(--color-surface-card)" }}
        >
          <div className="h-4 w-2/5 rounded mb-2" style={{ backgroundColor: "var(--color-surface-muted)" }} />
          <div className="h-3 w-1/4 rounded" style={{ backgroundColor: "var(--color-surface-muted)" }} />
        </div>
      ))}
    </div>
  );
}
