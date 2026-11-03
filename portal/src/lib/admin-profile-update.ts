import type { SupabaseClient } from "@supabase/supabase-js";

type ProfilePatch = {
  full_name?: string;
  role?: string;
  year_level?: string;
  subjects?: string[];
  last_sign_in_at?: string;
  email?: string;
};

function missingStudentColumns(message: string) {
  return /year_level|subjects|schema cache/i.test(message);
}

/** Updates a profile; retries without year_level/subjects if those columns are not migrated yet. */
export async function updateProfileAdmin(
  service: SupabaseClient,
  id: string,
  patch: ProfilePatch
) {
  const { error } = await service.from("profiles").update(patch).eq("id", id);
  if (!error) return null;
  if (!missingStudentColumns(error.message)) return error.message;

  const base = { ...patch };
  delete base.year_level;
  delete base.subjects;
  const retry = await service.from("profiles").update(base).eq("id", id);
  return retry.error?.message || null;
}
