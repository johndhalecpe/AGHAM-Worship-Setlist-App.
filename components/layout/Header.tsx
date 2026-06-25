"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/setlists", label: "Lineups" },
  { href: "/songs", label: "Songs" },
];

export default function Header() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/setlists") return pathname.startsWith("/setlists");
    if (href === "/songs") return pathname.startsWith("/songs");
    return pathname === href;
  }

  return (
    <header className="bg-white border-b border-neutral-200">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/setlists" className="font-bold text-lg text-neutral-900">
          Agham Setlist
        </Link>
        <nav className="flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "text-blue-600"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
