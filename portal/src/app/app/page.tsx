import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardTabs } from "./DashboardTabs";
import { TutorCreateSession } from "./TutorCreateSession";

export default async function DashboardPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role === "unverified") redirect("/not-enrolled");

  const supabase = await createClient();

  if (profile.role === "student") {
    const { data: enrolments } = await supabase
      .from("enrolments")
      .select("class_id")
      .eq("profile_id", profile.id);
    const { data: privateLinks } = await supabase
      .from("private_assignments")
      .select("tutor_id")
      .eq("student_id", profile.id);
    if (!enrolments?.length && !privateLinks?.length) redirect("/not-enrolled");
  }

  const { data: resourceClasses } = await supabase
    .from("classes")
    .select("id, name, subject, unit_band, year_label, stream")
    .eq("stream", "masterclass")
    .order("name");

  let masterClassIds: string[] = [];
  if (profile.role === "student") {
    const { data: enrolments } = await supabase
      .from("enrolments")
      .select("class_id")
      .eq("profile_id", profile.id);
    masterClassIds = (enrolments || []).map((e) => e.class_id);
  } else if (profile.role === "tutor") {
    const { data: tutored } = await supabase
      .from("class_tutors")
      .select("class_id")
      .eq("profile_id", profile.id);
    masterClassIds = (tutored || []).map((t) => t.class_id);
  } else if (profile.role === "admin") {
    masterClassIds = (resourceClasses || []).map((c) => c.id);
  }

  const now = new Date().toISOString();
  let masterSessions: {
    id: string;
    title: string;
    starts_at: string;
    ends_at: string;
    location_or_link: string;
    class_id: string | null;
  }[] = [];

  if (masterClassIds.length) {
    const { data } = await supabase
      .from("sessions")
      .select("id, title, starts_at, ends_at, location_or_link, class_id")
      .eq("type", "masterclass")
      .in("class_id", masterClassIds)
      .gte("starts_at", now)
      .order("starts_at", { ascending: true })
      .limit(20);
    masterSessions = data || [];
  }

  const classNameById = new Map((resourceClasses || []).map((c) => [c.id, c.name]));
  const masterclassSessions = masterSessions.map((s) => ({
    ...s,
    className: s.class_id ? classNameById.get(s.class_id) : undefined,
  }));

  type PairRow = {
    tutor_id: string;
    student_id: string;
    subject: string | null;
    note: string | null;
    tutor?: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null;
    student?:
      | { id: string; full_name: string | null; email: string }
      | { id: string; full_name: string | null; email: string }[]
      | null;
  };

  let pairRows: PairRow[] = [];
  if (profile.role === "student") {
    const { data } = await supabase
      .from("private_assignments")
      .select("tutor_id, student_id, subject, note, tutor:profiles!tutor_id (full_name, email)")
      .eq("student_id", profile.id);
    pairRows = (data || []) as PairRow[];
  } else if (profile.role === "tutor") {
    const { data } = await supabase
      .from("private_assignments")
      .select(
        "tutor_id, student_id, subject, note, student:profiles!student_id (id, full_name, email)"
      )
      .eq("tutor_id", profile.id);
    pairRows = (data || []) as PairRow[];
  } else {
    const { data } = await supabase
      .from("private_assignments")
      .select(
        "tutor_id, student_id, subject, note, student:profiles!student_id (id, full_name, email), tutor:profiles!tutor_id (full_name, email)"
      );
    pairRows = (data || []) as PairRow[];
  }

  const privateAssignments = pairRows.map((p) => {
    const tutor = Array.isArray(p.tutor) ? p.tutor[0] : p.tutor;
    const student = Array.isArray(p.student) ? p.student[0] : p.student;
    let partnerLabel = "";
    if (profile.role === "student") {
      partnerLabel = `Tutor: ${tutor?.full_name || tutor?.email || "Assigned"}`;
    } else if (profile.role === "tutor") {
      partnerLabel = `Student: ${student?.full_name || student?.email || "Assigned"}`;
    } else {
      partnerLabel = `${tutor?.full_name || tutor?.email || "Tutor"} ↔ ${
        student?.full_name || student?.email || "Student"
      }`;
    }
    return {
      subject: p.subject,
      note: p.note,
      partnerLabel,
      studentId: p.student_id,
      tutorId: p.tutor_id,
    };
  });

  const tutorSessionStudents = Array.from(
    new Map(
      privateAssignments.map((p) => [
        p.studentId,
        {
          id: p.studentId,
          label:
            p.partnerLabel.replace(/^Student:\s*/, "").replace(/^.*↔\s*/, "") +
            (p.subject ? ` · ${p.subject}` : ""),
        },
      ])
    ).values()
  );

  let filesQuery = supabase
    .from("private_pair_files")
    .select("id, title, created_at, student_id, tutor_id")
    .order("created_at", { ascending: false })
    .limit(40);
  if (profile.role === "student") filesQuery = filesQuery.eq("student_id", profile.id);
  else if (profile.role === "tutor") filesQuery = filesQuery.eq("tutor_id", profile.id);
  const { data: privateFilesRaw } = await filesQuery;

  const nameByStudent = new Map(
    privateAssignments.map((p) => [
      p.studentId,
      p.partnerLabel.replace(/^Student:\s*/, "").replace(/^.*↔\s*/, ""),
    ])
  );

  const privateFiles = (privateFilesRaw || []).map((f) => ({
    ...f,
    studentLabel: nameByStudent.get(f.student_id),
  }));

  return (
    <>
      <p className="section-kicker">Dashboard</p>
      <h1 className="section-title">Your portal</h1>
      <p className="muted" style={{ marginBottom: "1.15rem" }}>
        Resources are shared. Masterclass is times + free consult. Private 1-on-1 is your pair
        schedule and custom homework.
      </p>

      <DashboardTabs
        role={profile.role}
        resourceClasses={resourceClasses || []}
        masterclassSessions={masterclassSessions}
        privateAssignments={privateAssignments}
        privateFiles={privateFiles}
        tutorStudents={profile.role === "student" ? [] : tutorSessionStudents}
      />

      {profile.role === "tutor" && (
        <div style={{ marginTop: "1.75rem" }}>
          <h2 style={{ fontSize: "1.05rem", marginBottom: "0.65rem" }}>Quick private session</h2>
          <TutorCreateSession students={tutorSessionStudents} />
        </div>
      )}
    </>
  );
}
