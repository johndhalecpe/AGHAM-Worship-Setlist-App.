import type { Metadata } from "next";
import { getSetlistById } from "@/lib/services/setlistsService";
import { getSectionsBySetlistIdForPage } from "@/lib/services/setlistSectionsService";
import { getBranchLabel } from "@/lib/branches";
import SetlistDetail from "./SetlistDetail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const setlist = await getSetlistById(id);

  if (!setlist) {
    return { title: "Setlist not found" };
  }

  const date = new Date(setlist.date + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const branch = getBranchLabel(setlist.branch);

  const title = `Worship Lineup — ${date} — ${branch}${setlist.title ? ` — ${setlist.title}` : ""}`;

  const description = setlist.song_leader
    ? `Song leader: ${setlist.song_leader}`
    : "Agham worship team lineup";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function SetlistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [setlist, sections] = await Promise.all([
    getSetlistById(id),
    getSectionsBySetlistIdForPage(id),
  ]);

  if (!setlist) {
    return (
      <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
        Setlist not found.
      </p>
    );
  }

  const isPast = new Date(setlist.date) < new Date(new Date().toDateString());

  return (
    <SetlistDetail
      id={id}
      initialSetlist={setlist}
      initialSections={sections}
      isPast={isPast}
    />
  );
}
