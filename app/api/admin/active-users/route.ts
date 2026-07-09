import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { ADMIN_EMAIL } from "@/lib/type";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);

  const { data: { user }, error: authError } = await getSupabase().auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({
      error: "Unauthorized",
      message: authError?.message ?? "Could not verify user from token",
    }, { status: 401 });
  }

  if (user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, name, role, status");

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

  const users = usersData.users
    .filter((u) => u.email)
    .map((u) => {
      const profile = profileMap.get(u.id);
      return {
        user_id: u.id,
        email: u.email!,
        name: profile?.name ?? u.email!.split("@")[0],
        role: profile?.role ?? null,
        status: profile?.status ?? null,
      };
    });

  return NextResponse.json({ users });
}
