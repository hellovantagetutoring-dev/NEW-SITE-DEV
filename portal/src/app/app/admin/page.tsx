import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminForms } from "./AdminForms";

export default async function AdminPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/app");

  const supabase = await createClient();
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, subject, unit_band")
    .order("name");

  let profiles: { id: string; email: string; full_name: string; role: string }[] = [];
  if (profile.role === "admin") {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name, role")
      .order("email")
      .limit(200);
    profiles = data || [];
  }

  return (
    <AppShell profile={profile} active="admin">
      <h1 className="section-title">Admin</h1>
      <p className="muted" style={{ marginBottom: "1.25rem" }}>
        Masterclass resources and enrolments are admin-only. Tutors only get private 1-on-1
        student links for scheduling — they cannot upload or release files.
      </p>
      <AdminForms
        isAdmin={profile.role === "admin"}
        classes={classes || []}
        profiles={profiles}
      />
    </AppShell>
  );
}
