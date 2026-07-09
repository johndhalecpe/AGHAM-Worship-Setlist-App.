import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { ADMIN_EMAIL } from "@/lib/type";

export async function POST(request: Request) {
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
  const { email, newPassword, resetId } = await request.json();
  if (!email || !newPassword || !resetId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let targetId: string | undefined;

  try {
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }
    targetId = listData?.users?.find((u: { email?: string | null }) => u.email === email)?.id;
  } catch (e) {
    console.warn("listUsers threw, falling back to RPC for set-password:", e);
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc("get_active_users");
    if (rpcError) {
      return NextResponse.json({ error: typeof rpcError === "string" ? rpcError : rpcError.message }, { status: 500 });
    }
    const found = ((rpcData ?? []) as { user_id: string; email: string }[]).find((u) => u.email === email);
    if (found) targetId = found.user_id;
  }

  if (!targetId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    targetId,
    { password: newPassword },
  );
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: resolveError } = await supabaseAdmin
    .from("password_resets")
    .update({ resolved: true })
    .eq("id", resetId);
  if (resolveError) {
    return NextResponse.json({ error: resolveError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
