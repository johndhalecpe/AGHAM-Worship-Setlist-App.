import { NextResponse } from "next/server";
import { isSetlistDateInPast } from "@/lib/services/setlistsService";
import { getSectionsBySetlistId, createSection, deleteSection, updateSections } from "@/lib/services/setlistSectionsService";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const sections = await getSectionsBySetlistId(id);
    return NextResponse.json(sections);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (await isSetlistDateInPast(id)) {
    return NextResponse.json(
      { error: "Cannot modify a past setlist" },
      { status: 403 }
    );
  }

  const body = await request.json();

  try {
    const section = await createSection({
      setlist_id: id,
      song_id: body.song_id,
      section_type: body.section_type,
    });
    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (await isSetlistDateInPast(id)) {
    return NextResponse.json(
      { error: "Cannot modify a past setlist" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const sectionId = searchParams.get("sectionId");

  if (!sectionId) {
    return NextResponse.json({ error: "sectionId is required" }, { status: 400 });
  }

  try {
    await deleteSection(sectionId, id);
    return NextResponse.json({ message: "Song removed from setlist" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (await isSetlistDateInPast(id)) {
      return NextResponse.json(
        { error: "Cannot modify a past setlist" },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.items || !Array.isArray(body.items)) {
      return NextResponse.json(
        { error: "Invalid request body: items must be an array" },
        { status: 400 }
      );
    }

    await updateSections(id, body.items);
    return NextResponse.json({ message: "Order updated" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
