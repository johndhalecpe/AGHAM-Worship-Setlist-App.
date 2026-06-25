import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center text-center max-w-sm">
        <h1 className="text-3xl font-bold text-neutral-900 leading-tight flex flex-wrap items-center justify-center gap-x-2">
          <span>Welcome,</span>
          <Image
            src="/logo.jpg"
            alt="Agham"
            width={120}
            height={40}
            className="inline h-8 w-auto object-contain"
          />
          <span>&rsquo;s worship team.</span>
        </h1>
        <p className="text-neutral-500 mt-4 text-sm leading-relaxed">
          Plan your lineups, organize your songs, and lead worship together.
        </p>
        <Link
          href="/setlists"
          className="mt-8 bg-blue-600 text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          View lineups
        </Link>
      </div>
      <p className="mt-16 text-xs text-neutral-400">Agham Setlist &mdash; 2026</p>
    </div>
  );
}
