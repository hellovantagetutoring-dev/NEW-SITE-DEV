import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SUBJECT_ACCENT } from "@/lib/types";
import { TutorCreateSession } from "./TutorCreateSession";

export default async function DashboardPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  // —— Tutor: 1-1 students only ——
  if (profile.role === "tutor") {
    const { data: assignments } = await supabase
      .from("private_assignments")
      .select("student_id, subject, note, profiles:student_id (id, full_name, email)")
      .eq("tutor_id", profile.id);

    return (
      <AppShell profile={profile} active="dashboard">
        <h1 className="section-title">My 1-on-1 students</h1>
        <p className="muted" style={{ marginBottom: "1.25rem" }}>
          Organise private sessions here. Resource uploads and solution releases are handled by
          Admin.
        </p>
        <div className="grid-cards" style={{ marginBottom: "1.5rem" }}>
          {(assignments || []).map((a) => {
            const student = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
            if (!student) return null;
            return (
              <div key={student.id} className="card">
                <span className="pill">Private</span>
                <h2 style={{ margin: "0.65rem 0 0.25rem", fontSize: "1.05rem" }}>
                  {student.full_name || student.email}
                </h2>
                <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
                  {a.subject || "1-on-1"}
                  {a.note ? ` · ${a.note}` : ""}
                </p>
                <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.82rem" }}>
                  {student.email}
                </p>
              </div>
            );
          })}
        </div>
        {!assignments?.length && (
          <p className="muted" style={{ marginBottom: "1.25rem" }}>
            No private students assigned yet. Ask Admin to link students to you.
          </p>
        )}
        <TutorCreateSession
          students={(assignments || [])
            .map((a) => {
              const s = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
              return s
                ? { id: s.id, label: `${s.full_name || s.email}${a.subject ? ` · ${a.subject}` : ""}` }
                : null;
            })
            .filter(Boolean) as { id: string; label: string }[]}
        />
        <p style={{ marginTop: "1.25rem" }}>
          <Link href="/app/calendar" className="btn btn-ghost">
            Open calendar
          </Link>
        </p>
      </AppShell>
    );
  }

  // —— Student / Admin: classes by stream ——
  let classIds: string[] | null = null;
  if (profile.role === "student") {
    const { data: enrolments } = await supabase
      .from("enrolments")
      .select("class_id")
      .eq("profile_id", profile.id);
    classIds = (enrolments || []).map((e) => e.class_id);
    const { data: privateLinks } = await supabase
      .from("private_assignments")
      .select("tutor_id")
      .eq("student_id", profile.id);
    if (!classIds.length && !privateLinks?.length) redirect("/not-enrolled");
  }

  let classesQuery = supabase
    .from("classes")
    .select("id, name, subject, unit_band, year_label, stream");
  if (classIds) {
    if (!classIds.length) {
      classesQuery = classesQuery.in("id", ["00000000-0000-0000-0000-000000000000"]);
    } else {
      classesQuery = classesQuery.in("id", classIds);
    }
  }
  const { data: classes } = await classesQuery.order("name");

  const { data: privateForStudent } =
    profile.role === "student"
      ? await supabase
          .from("private_assignments")
          .select("subject, note, profiles:tutor_id (full_name, email)")
          .eq("student_id", profile.id)
      : { data: [] as const };

  const masterclass = (classes || []).filter((c) => (c.stream || "masterclass") === "masterclass");
  const privateClasses = (classes || []).filter((c) => c.stream === "private");

  return (
    <AppShell profile={profile} active="dashboard">
      <h1 className="section-title">Your programs</h1>
      <p className="muted" style={{ marginBottom: "1.25rem" }}>
        Masterclass and Private 1-on-1 are separate streams — you can be in either or both.
      </p>

      <h2 style={{ fontSize: "1.05rem", marginBottom: "0.65rem" }}>Masterclass</h2>
      <div className="grid-cards" style={{ marginBottom: "1.75rem" }}>
        {masterclass.map((c) => {
          const accent = SUBJECT_ACCENT[c.subject.toLowerCase()] || "var(--gold)";
          return (
            <Link
              key={c.id}
              href={`/app/classes/${c.id}`}
              className="card"
              style={{ borderTop: `4px solid ${accent}` }}
            >
              <span className="pill">Masterclass</span>
              <h3 style={{ margin: "0.65rem 0 0.25rem", fontSize: "1.05rem" }}>{c.name}</h3>
              <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
                {[c.subject, c.unit_band, c.year_label].filter(Boolean).join(" · ")}
              </p>
            </Link>
          );
        })}
      </div>
      {!masterclass.length && (
        <p className="muted" style={{ marginTop: "-1rem", marginBottom: "1.5rem" }}>
          No masterclass enrolments.
        </p>
      )}

      <h2 style={{ fontSize: "1.05rem", marginBottom: "0.65rem" }}>Private 1-on-1</h2>
      <div className="grid-cards">
        {privateClasses.map((c) => {
          const accent = SUBJECT_ACCENT[c.subject.toLowerCase()] || "var(--gold)";
          return (
            <Link
              key={c.id}
              href={`/app/classes/${c.id}`}
              className="card"
              style={{ borderTop: `4px solid ${accent}` }}
            >
              <span className="pill">Private</span>
              <h3 style={{ margin: "0.65rem 0 0.25rem", fontSize: "1.05rem" }}>{c.name}</h3>
              <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
                {[c.subject, c.unit_band].filter(Boolean).join(" · ")}
              </p>
            </Link>
          );
        })}
        {(privateForStudent || []).map((p, i) => {
          const tutor = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
          return (
            <div key={`pa-${i}`} className="card" style={{ borderTop: "4px solid var(--gold)" }}>
              <span className="pill">Private</span>
              <h3 style={{ margin: "0.65rem 0 0.25rem", fontSize: "1.05rem" }}>
                {p.subject || "1-on-1 tutoring"}
              </h3>
              <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
                Tutor: {tutor?.full_name || tutor?.email || "Assigned"}
              </p>
              <p style={{ marginTop: "0.75rem" }}>
                <Link href="/app/calendar" className="btn btn-ghost" style={{ padding: "0.4rem 0.8rem" }}>
                  View sessions
                </Link>
              </p>
            </div>
          );
        })}
      </div>
      {!privateClasses.length && !privateForStudent?.length && (
        <p className="muted">No private 1-on-1 assignments.</p>
      )}

      {profile.role === "admin" && !classes?.length && (
        <p className="muted" style={{ marginTop: "1.25rem" }}>
          No classes yet — create them in Admin.
        </p>
      )}
    </AppShell>
  );
}
