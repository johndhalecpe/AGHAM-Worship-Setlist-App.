import Header from "@/components/layout/Header";
import RequireAuth from "./RequireAuth";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-8 pt-[calc(3.5rem+2rem)] w-full">
          {children}
        </main>

      </div>
    </RequireAuth>
  );
}
