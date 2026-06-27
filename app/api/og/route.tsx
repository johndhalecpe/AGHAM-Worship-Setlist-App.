import { ImageResponse } from "@vercel/og";
import { supabase } from "@/lib/supabase";

export const runtime = "edge";

const SECTION_LABELS: Record<string, string> = {
  worship: "Worship",
  praise: "Praise",
  tithes_offering: "Tithes & Offering",
  special: "Special",
};

const SECTION_ORDER = ["worship", "praise", "tithes_offering", "special"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  const { data: setlist, error: setlistError } = await supabase
    .from("setlists")
    .select("*")
    .eq("id", id)
    .single();

  if (setlistError || !setlist) {
    return new Response("Not found", { status: 404 });
  }

  const { data: sections, error: sectionsError } = await supabase
    .from("setlist_sections")
    .select("*, songs(title, author, category)")
    .eq("setlist_id", id)
    .order("sort_order", { ascending: true });

  if (sectionsError) {
    return new Response("Error", { status: 500 });
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
          height: 630,
          display: "flex",
          flexDirection: "column",
          background: "#1a1a1a",
          color: "#f0f0f0",
          fontFamily: "system-ui, sans-serif",
          padding: 48,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://worship-setlist.vercel.app/transparent-logo.svg"
            width={48}
            height={48}
            alt="logo"
            style={{ borderRadius: 8 }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.02em" }}>
              {setlist.date}
            </span>
            {setlist.title && (
              <span style={{ fontSize: 20, opacity: 0.8, marginTop: 4 }}>
                {setlist.title}
              </span>
            )}
            {setlist.song_leader && (
              <span style={{ fontSize: 16, opacity: 0.6, marginTop: 2 }}>
                Song leader: {setlist.song_leader}
              </span>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            gap: 32,
          }}
        >
          {grouped.map((group) => (
            <div
              key={group.type}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                background: "rgba(255,255,255,0.06)",
                borderRadius: 12,
                padding: 20,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  opacity: 0.5,
                  marginBottom: 12,
                }}
              >
                {group.label}
              </span>
              {group.songs.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 500 }}>
                    {s.songs.title}
                  </span>
                  {s.songs.author && (
                    <span style={{ fontSize: 12, opacity: 0.5 }}>
                      {s.songs.author}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
