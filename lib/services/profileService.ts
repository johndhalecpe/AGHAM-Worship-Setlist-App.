import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/type";

export async function getProfile(): Promise<Profile | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;
  return data as Profile;
}

export async function getPendingProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data as Profile[];
}

export async function updateProfileName(name: string): Promise<{ error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return { error: "Not authenticated" };

  const res = await fetch("/api/profile/update-name", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    const json = await res.json();
    return { error: json.error ?? "Failed to update name" };
  }

  return {};
}

export async function getPalette(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return null;

  const res = await fetch("/api/profile/palette", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;
  const json = await res.json();
  return json.palette ?? null;
}

export async function updatePalette(palette: string): Promise<{ error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return { error: "Not authenticated" };

  const res = await fetch("/api/profile/palette", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ palette }),
  });

  if (!res.ok) {
    const json = await res.json();
    return { error: json.error ?? "Failed to update palette" };
  }

  return {};
}
