import Image from "next/image";
import Link from "next/link";


function HomePageSkeleton() {
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
    <>
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0" aria-hidden="true">
        <HomePageSkeleton />
      </div>

      <div className="absolute inset-0 backdrop-blur" aria-hidden="true" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div
          className="w-full max-w-md rounded-3xl p-8 sm:p-12 text-center"
          style={{
            backgroundColor: "var(--color-surface-card)",
            boxShadow:
              "0 4px 6px -1px rgba(0,0,0,.05), 0 10px 24px -4px rgba(0,0,0,.08)",
          }}
        >
          <Image
            src="/transparent-logo.svg"
            alt="Agham Setlist"
            className="mx-auto mb-8 w-36 h-36 sm:w-44 sm:h-44 object-contain"
            width={176}
            height={176}
          />
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
            Plan your{" "}
            <span style={{ color: "var(--color-accent)" }}>Worship</span>
            <br />
            <span className="text-2xl sm:text-3xl">
              Lead the{" "}
              <span style={{ color: "var(--color-accent)" }}>Congregation</span>
            </span>
          </h1>
          <p
            className="mt-4 text-sm sm:text-base leading-relaxed"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Welcome,{" "}
            <span className="font-semibold" style={{ color: "var(--color-accent)" }}>
              Agham{" "}
            </span>
            worship team!
          </p>
          <Link
            href="/setlists"
            className="spotlight-btn inline-flex items-center rounded-xl px-14 py-5 text-lg font-semibold mt-10 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-accent)]"
            style={{
              background: "linear-gradient(135deg, var(--color-accent), #e8632a)",
              color: "#fff",
            }}
          >
            View lineups
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
