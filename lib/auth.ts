import { supabase } from "./supabase";

export async function signUp(params: {
  email: string;
  password: string;
  name: string;
  role: "singer" | "musician" | "staff";
}) {
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        name: params.name,
        role: params.role,
      },
    },
  });
  return { data, error };
}

export async function signIn(params: {
  email: string;
  password: string;
}) {
  const result = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  });
  return result;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function changePassword(params: {
  email: string;
  oldPassword: string;
  newPassword: string;
}) {
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.oldPassword,
  });
  if (signInError) return { error: signInError };

  const { error } = await supabase.auth.updateUser({
    password: params.newPassword,
  });
  return { error };
}

export async function requestPasswordReset(params: {
  email: string;
  requested_password: string;
}) {
  const { data, error } = await supabase
    .from("password_resets")
    .insert({
      email: params.email,
      requested_password: params.requested_password,
    })
    .select()
    .single();
  return { data, error };
}

export async function getPasswordResets() {
  const { data, error } = await supabase
    .from("password_resets")
    .select("*")
    .eq("resolved", false)
    .order("created_at", { ascending: true });
  return { data: data as import("./type").PasswordReset[] | null, error };
}

export async function resolvePasswordReset(id: string) {
  const { error } = await supabase
    .from("password_resets")
    .update({ resolved: true })
    .eq("id", id);
  return { error };
}
