import Header from "@/components/layout/Header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">
        {children}
      </main>
      <footer
        className="pb-6 text-center text-xs"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        Agham Setlist &mdash; 2026 <br />
        Dev: Dhale_CpE
      </footer>
    </div>
  );
}
