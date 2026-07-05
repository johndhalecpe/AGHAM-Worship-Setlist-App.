import { getSetlistsWithSections } from "@/lib/services/setlistsService";
import SetlistList from "./_components/SetlistList";

export const dynamic = "force-dynamic";

export default async function SetlistsPage() {
  const setlists = await getSetlistsWithSections();

  return <SetlistList setlists={setlists} />;
}
