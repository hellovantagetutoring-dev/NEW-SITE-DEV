import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, last_sign_in_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) return null;

  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (admins.includes(data.email.toLowerCase()) && data.role !== "admin") {
    await supabase.from("profiles").update({ role: "admin" }).eq("id", data.id);
    return { ...data, role: "admin" };
  }

  return data as Profile;
});

export async function requireProfile() {
  const profile = await getProfile();
  if (!profile) throw new Error("UNAUTHENTICATED");
  return profile;
}
