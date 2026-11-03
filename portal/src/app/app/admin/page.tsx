import { redirect } from "next/navigation";
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
    .select("id, name, subject, unit_band, stream")
    .order("name");

  const firstProfiles = await supabase
    .from("profiles")
    .select("id, email, full_name, role, year_level, subjects")
    .order("email")
    .limit(200);
  let profilesRaw = firstProfiles.data;
  if (firstProfiles.error) {
    const fallback = await supabase
      .from("profiles")
      .select("id, email, full_name, role")
      .order("email")
      .limit(200);
    profilesRaw = (fallback.data || []).map((p) => ({
      ...p,
      year_level: "",
      subjects: [] as string[],
    }));
  }

  const { data: pairsRaw } = await supabase
    .from("private_assignments")
    .select(
      "tutor_id, student_id, subject, note, tutor:profiles!tutor_id(full_name, email), student:profiles!student_id(full_name, email)"
    )
    .order("created_at", { ascending: false });

  const pairs = (pairsRaw || []).map((p) => {
    const tutor = Array.isArray(p.tutor) ? p.tutor[0] : p.tutor;
    const student = Array.isArray(p.student) ? p.student[0] : p.student;
    return {
      tutor_id: p.tutor_id,
      student_id: p.student_id,
      subject: p.subject || "",
      note: p.note || "",
      tutorLabel: tutor?.full_name || tutor?.email || "Tutor",
      studentLabel: student?.full_name || student?.email || "Student",
      tutorEmail: tutor?.email || "",
      studentEmail: student?.email || "",
    };
  });

  type EnrolRow = {
    profile_id: string;
    class_id: string;
    tier?: string;
    classes?:
      | { id: string; subject: string; stream: string; name: string }
      | { id: string; subject: string; stream: string; name: string }[]
      | null;
  };

  const enrolQuery = await supabase
    .from("enrolments")
    .select("profile_id, class_id, tier, classes:class_id (id, subject, stream, name)");
  let enrolmentRows: EnrolRow[] = (enrolQuery.data || []) as EnrolRow[];
  if (enrolQuery.error) {
    const fallback = await supabase.from("enrolments").select("profile_id, class_id, tier");
    enrolmentRows = (fallback.data || []).map((e) => ({
      profile_id: e.profile_id,
      class_id: e.class_id,
      tier: e.tier || "masterclass",
      classes: null,
    }));
  }

  // Prefer the already-loaded classes list so subject never blanks when the embed join fails.
  const classById = new Map((classes || []).map((c) => [c.id, c]));

  const enrolments = enrolmentRows.map((e) => {
    const embedded = Array.isArray(e.classes) ? e.classes[0] : e.classes;
    const fromList = classById.get(e.class_id);
    const subject = (
      fromList?.subject ||
      embedded?.subject ||
      ""
    ).toLowerCase();
    return {
      profile_id: e.profile_id,
      class_id: e.class_id,
      tier: e.tier || "masterclass",
      subject,
      stream: fromList?.stream || embedded?.stream || "masterclass",
      className: fromList?.name || embedded?.name || "",
    };
  });

  // Keep role as stored: Progress-only students (no class/private yet) stay "student",
  // not remapped to unverified — that was undoing Admin → Enrol for new emails.
  const profiles = [...(profilesRaw || [])].sort((a, b) => {
    const au = a.role === "unverified" ? 0 : 1;
    const bu = b.role === "unverified" ? 0 : 1;
    if (au !== bu) return au - bu;
    return a.email.localeCompare(b.email);
  });

  return (
    <>
      <p className="section-kicker">Operations</p>
      <h1 className="section-title">Admin</h1>
      <p className="muted admin-lead">
        People for membership and gated access. Access for pairs. Resources for uploads. Classes for
        subject libraries.
      </p>
      <AdminForms
        isAdmin={profile.role === "admin"}
        classes={classes || []}
        profiles={profiles || []}
        pairs={pairs}
        enrolments={enrolments}
      />
    </>
  );
}
