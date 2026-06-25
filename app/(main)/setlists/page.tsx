import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Setlist } from "@/lib/type";

async function getSetlists(): Promise<Setlist[]> {
  const { data, error } = await supabase
    .from("setlists")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export default async function SetlistsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const setlists = await getSetlists();
  const today = new Date().toISOString().split("T")[0];

  const filtered = setlists.filter((setlist) => {
    if (filter === "past") {
      return setlist.date < today;
    }
    return setlist.date >= today;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-neutral-900">
          {filter === "past" ? "Past Lineups" : "Upcoming Lineups"}
        </h2>
        <Link
          href="/setlists/new"
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Add a setlist
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {filtered.map((setlist) => (
          <Link key={setlist.id} href={`/setlists/${setlist.id}`}>
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5 hover:shadow-md hover:border-neutral-300 transition-all cursor-pointer">
              <p className="font-bold text-neutral-900">{setlist.date}</p>
              {setlist.title && (
                <p className="text-sm text-neutral-600 mt-0.5">
                  {setlist.title}
                </p>
              )}
              {setlist.description && (
                <p className="text-xs text-neutral-400 italic mt-0.5">
                  {setlist.description}
                </p>
              )}
              {setlist.song_leader && (
                <p className="text-sm text-neutral-500 mt-1.5">
                  {setlist.song_leader}
                </p>
              )}
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-neutral-400 text-sm col-span-2">
            No setlists found.
          </p>
        )}
      </div>
    </div>
  );
}
