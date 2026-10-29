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
    .select("id, name, subject, unit_band")
    .order("name");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .order("email")
    .limit(200);

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

  return (
    <>
      <p className="section-kicker">Operations</p>
      <h1 className="section-title">Admin</h1>
      <p className="muted" style={{ marginBottom: "1.25rem" }}>
        Manage people and tutoring pairs here. Use Calendar to add sessions, generate a QLD term, or
        approve change requests. Tutors cannot upload or release PDFs.
      </p>
      <AdminForms
        isAdmin={profile.role === "admin"}
        classes={classes || []}
        profiles={profiles || []}
        pairs={pairs}
      />
    </>
  );
}
