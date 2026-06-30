"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/setlists", label: "Lineups" },
  { href: "/songs", label: "Songs" },
];

export default function Header() {
  const pathname = usePathname();
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const dark = stored !== "light";
    setIsDarkMode(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  function toggleDarkMode() {
    const next = !isDarkMode;
    setIsDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  function isNavLinkActive(href: string) {
    if (href === "/setlists") return pathname.startsWith("/setlists");
    if (href === "/songs") return pathname.startsWith("/songs");
    return pathname === href;
  }

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-md bg-(--color-surface-card)/80 border-b"
      style={{ borderColor: "var(--color-border)" }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center"
        >
          <Image
            src="/transparent-logo.svg"
            alt="Agham Setlist"
            className="h-15 sm:h-18 w-auto mt-0.5"
            width={40}
            height={40}
          />
        </Link>
        <nav className="flex items-center gap-3 sm:gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium transition-colors"
              style={{
                color: isNavLinkActive(link.href)
                  ? "#D84F0B"
                  : "var(--color-text-secondary)",
              }}
              onMouseEnter={(e) => {
                if (!isNavLinkActive(link.href))
                  (e.target as HTMLElement).style.color = "var(--color-text)";
              }}
              onMouseLeave={(e) => {
                if (!isNavLinkActive(link.href))
                  (e.target as HTMLElement).style.color =
                    "var(--color-text-secondary)";
              }}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={toggleDarkMode}
            className="ml-2 p-2 rounded-lg transition-colors active:scale-95"
            style={{
              backgroundColor: "var(--color-surface-muted)",
              touchAction: "manipulation",
            }}
            aria-label="Toggle theme"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-4 h-4"
              style={{
                color: "var(--color-text)",
                display: isDarkMode ? "block" : "none",
              }}
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
              style={{
                color: "var(--color-text)",
                display: isDarkMode ? "none" : "block",
              }}
            >
              <path fillRule="evenodd" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </button>
        </nav>
      </div>
    </header>
  );
}
