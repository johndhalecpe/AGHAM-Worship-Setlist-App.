import { NextResponse } from "next/server";
import { getSetlistById, updateSetlist, deleteSetlist, isSetlistDateInPast } from "@/lib/services/setlistsService";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const setlist = await getSetlistById(id);

  if (!setlist) {
    return NextResponse.json({ error: "Setlist not found" }, { status: 404 });
  }

  return NextResponse.json(setlist);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (await isSetlistDateInPast(id)) {
    return NextResponse.json(
      { error: "Cannot edit a past setlist" },
      { status: 403 }
    );
  }

  const body = await request.json();

  try {
    const setlist = await updateSetlist(id, body);
    return NextResponse.json(setlist);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (await isSetlistDateInPast(id)) {
    return NextResponse.json(
      { error: "Cannot delete a past setlist" },
      { status: 403 }
    );
  }

  try {
    await deleteSetlist(id);
    return NextResponse.json({ message: "Setlist deleted" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
