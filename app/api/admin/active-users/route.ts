import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { ADMIN_EMAIL } from "@/lib/type";

export async function GET(request: Request) {
  try {
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

    let rawUsers: { id: string; email?: string | null }[] = [];

    try {
      const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
      if (!usersError && usersData?.users) {
        rawUsers = usersData.users;
      } else {
        console.warn("listUsers failed, falling back to RPC:", usersError?.message);
      }
    } catch (e) {
      console.warn("listUsers threw, falling back to RPC:", e);
    }

    if (rawUsers.length === 0) {
      const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc("get_active_users");
      if (rpcError) {
        const message = typeof rpcError === "string" ? rpcError : rpcError.message;
        return NextResponse.json({ error: message }, { status: 500 });
      }
      rawUsers = ((rpcData ?? []) as { user_id: string; email: string }[]).map((u) => ({
        id: u.user_id,
        email: u.email,
      }));
    }

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, name, role, status");

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

    const users = rawUsers
      .filter((u): u is { id: string; email: string } => !!u.email)
      .map((u) => {
        const profile = profileMap.get(u.id);
        return {
          user_id: u.id,
          email: u.email,
          name: profile?.name ?? u.email.split("@")[0],
          role: profile?.role ?? null,
          status: profile?.status ?? null,
        };
      });

    return NextResponse.json({ users });
  } catch (err) {
    console.error("active-users route error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
