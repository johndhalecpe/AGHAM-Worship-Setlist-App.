import { ImageResponse } from "@vercel/og";
import { supabase } from "@/lib/supabase";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const alt = "Worship Setlist";
export const size = { width: 1200, height: 1200 };
export const contentType = "image/png";

const SECTION_LABELS: Record<string, string> = {
  worship: "Worship",
  praise: "Praise",
  tithes_offering: "Tithes & Offering",
  special: "Special",
};

const SECTION_ORDER = ["worship", "praise", "tithes_offering", "special"];

const geistFont = readFile(
  path.join(process.cwd(), "node_modules/@vercel/og/dist/Geist-Regular.ttf")
);

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [setlistResult, sectionsResult] = await Promise.all([
    supabase.from("setlists").select("*").eq("id", id).single(),
    supabase
      .from("setlist_sections")
      .select("*, songs(title, author, category)")
      .eq("setlist_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  const { data: setlist, error: setlistError } = setlistResult;
  const { data: sections, error: sectionsError } = sectionsResult;

  if (setlistError || !setlist) {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 1200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#1A1916",
            color: "#E8E3D8",
            fontSize: 48,
            fontFamily: "Geist",
          }}
        >
          Setlist not found
        </div>
      ),
      { width: 1200, height: 1200, fonts: [{ name: "Geist", data: await geistFont, weight: 400 }] }
    );
  }

  const grouped = SECTION_ORDER.map((type) => ({
    type,
    label: SECTION_LABELS[type] ?? type,
    songs: (sections ?? []).filter((s) => s.section_type === type),
  })).filter((g) => g.songs.length > 0);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 1200,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          background: "#1A1916",
          color: "#E8E3D8",
          fontFamily: "Geist",
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 20,
            }}
          >
            <img
              src="https://agham-worship-setlist-app.vercel.app/transparent-logo.svg"
              width={72}
              height={72}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 72, fontWeight: 700, color: "#E8E3D8" }}>
                {setlist.date}
              </span>
              {setlist.title && (
                <span style={{ fontSize: 36, color: "#9C978E" }}>
                  {setlist.title}
                </span>
              )}
              {setlist.song_leader && (
                <span style={{ fontSize: 28, color: "#6B665E" }}>
                  Song leader: {setlist.song_leader}
                </span>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {grouped.map((group) => (
            <div
              key={group.type}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              <span
                style={{
                  width: 200,
                  fontSize: 28,
                  fontWeight: 600,
                  color: "#D84F0B",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  paddingTop: 10,
                }}
              >
                {group.label}
              </span>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {group.songs.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "baseline",
                      gap: 10,
                    }}
                  >
                    <span style={{ fontSize: 40, fontWeight: 500, color: "#E8E3D8" }}>
                      {s.songs.title}
                    </span>
                    {s.songs.author && (
                      <span style={{ fontSize: 26, color: "#6B665E" }}>
                        {s.songs.author}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 1200,
      fonts: [
        {
          name: "Geist",
          data: await geistFont,
          weight: 400,
        },
      ],
    }
  );
}
