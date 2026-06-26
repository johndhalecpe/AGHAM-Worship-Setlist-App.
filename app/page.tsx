import Image from "next/image";
import Link from "next/link";

function Silhouette() {
  return (
    <div className="opacity-15 dark:opacity-10 pointer-events-none select-none">
      <div
        className="h-14 border-b"
        style={{ borderColor: "var(--color-border)" }}
      />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div
            className="h-7 w-44 rounded"
            style={{ backgroundColor: "var(--color-text-tertiary)" }}
          />
          <div
            className="h-9 w-32 rounded-lg"
            style={{ backgroundColor: "var(--color-gold-500)" }}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-xl"
              style={{ backgroundColor: "var(--color-surface-card)" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0" aria-hidden="true">
        <Silhouette />
      </div>

      <div className="absolute inset-0 backdrop-blur" aria-hidden="true" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div
          className="w-full max-w-md rounded-lg p-6 sm:p-10 text-center"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--color-surface-card) 75%, transparent)",
            border: "1px solid color-mix(in srgb, var(--color-border) 60%, transparent)",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 color-mix(in srgb, var(--color-border) 30%, transparent)",
          }}
        >
          <Image
            src="/transparent-logo.svg"
            alt="Agham Setlist"
            className="mx-auto mb-6 w-20 h-20 sm:w-24 sm:h-24 object-contain"
            width={96}
            height={96}
          />
          <h1
            className="text-lg sm:text-xl font-medium leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Welcome{" "}
            <span className="font-semibold" style={{ color: "#D84F0B" }}>
              Agham&rsquo;s{" "}
            </span>
            worship team.
          </h1>
          <p
            className="mt-3 text-sm leading-relaxed"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Plan your lineups, organize your songs, and lead worship together.
          </p>
          <Link
            href="/setlists"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium mt-7 transition-all hover:-translate-y-0.5"
            style={{
              backgroundColor: "#D84F0B",
              color: "#fff",
            }}
          >
            View lineups
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
