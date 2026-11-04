import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardTabs, type ProgramAccess } from "./DashboardTabs";
import { TutorCreateSession } from "./TutorCreateSession";

function isUcatSubject(subject: string | null | undefined) {
 return (subject || "").toLowerCase() === "ucat";
}

export default async function DashboardPage() {
 const profile = await getProfile();
 if (!profile) redirect("/login");

 const supabase = await createClient();
 const pendingAccess = profile.role === "unverified";

 const { data: resourceClasses } = await supabase
 .from("classes")
 .select("id, name, subject, unit_band, year_label, stream")
 .in("stream", ["masterclass", "library"])
 .order("name");

 const allClasses = resourceClasses || [];
 const libraryClasses = allClasses.filter((c) => (c.stream || "") === "library");
 const masterclassShelf = allClasses.filter((c) => (c.stream || "masterclass") === "masterclass");
 const masterclassClasses = masterclassShelf.filter((c) => !isUcatSubject(c.subject));
 const ucatClasses = masterclassShelf.filter((c) => isUcatSubject(c.subject));

 type EnrolDetail = {
 class_id: string;
 tier?: string | null;
 subject: string;
 };

 let enrolDetails: EnrolDetail[] = [];
 if (profile.role === "student" || profile.role === "unverified") {
 const withTier = await supabase
 .from("enrolments")
 .select("class_id, tier, classes:class_id (subject)")
 .eq("profile_id", profile.id);
 if (withTier.error) {
 const fallback = await supabase
 .from("enrolments")
 .select("class_id, classes:class_id (subject)")
 .eq("profile_id", profile.id);
 enrolDetails = (fallback.data || []).map((e) => {
 const klass = Array.isArray(e.classes) ? e.classes[0] : e.classes;
 return {
 class_id: e.class_id,
 tier: "masterclass",
 subject: (klass as { subject?: string } | null)?.subject || "",
 };
 });
 } else {
 enrolDetails = (withTier.data || []).map((e) => {
 const klass = Array.isArray(e.classes) ? e.classes[0] : e.classes;
 return {
 class_id: e.class_id,
 tier: (e as { tier?: string }).tier || "masterclass",
 subject: (klass as { subject?: string } | null)?.subject || "",
 };
 });
 }
 }

 let masterClassIds: string[] = [];
 if (profile.role === "student") {
 masterClassIds = enrolDetails.map((e) => e.class_id);
 } else if (profile.role === "tutor") {
 const { data: tutored } = await supabase
 .from("class_tutors")
 .select("class_id")
 .eq("profile_id", profile.id);
 masterClassIds = (tutored || []).map((t) => t.class_id);
 } else if (profile.role === "admin") {
 masterClassIds = masterclassShelf.map((c) => c.id);
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
 .limit(30);
 masterSessions = data || [];
 }

 const classById = new Map(allClasses.map((c) => [c.id, c]));
 const mappedSessions = masterSessions.map((s) => {
 const klass = s.class_id ? classById.get(s.class_id) : undefined;
 return {
 ...s,
 className: klass?.name,
 subject: klass?.subject || "",
 };
 });
 const masterclassSessions = mappedSessions.filter((s) => !isUcatSubject(s.subject));
 const ucatSessions = mappedSessions.filter((s) => isUcatSubject(s.subject));

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
 if (profile.role === "student" || profile.role === "unverified") {
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
 } else if (profile.role === "admin") {
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
 if (profile.role === "student" || profile.role === "unverified") {
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
 id: p.studentId!,
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
 .limit(200);
 if (profile.role === "student" || profile.role === "unverified") {
 filesQuery = filesQuery.eq("student_id", profile.id);
 } else if (profile.role === "tutor") {
 filesQuery = filesQuery.eq("tutor_id", profile.id);
 }
 const { data: privateFilesRaw } =
 profile.role === "unverified" || profile.role === "student" || profile.role === "tutor" || profile.role === "admin"
 ? await filesQuery
 : { data: [] };

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

 // Masterclass subject shelves unlock only with masterclass|both tier (not Private alone).
 const enrolledSubjectSlugs = new Set<string>();
 if (profile.role === "student" || profile.role === "unverified") {
 for (const e of enrolDetails) {
 if (!e.subject) continue;
 const t = e.tier || "masterclass";
 if (t === "masterclass" || t === "both") {
 enrolledSubjectSlugs.add(e.subject.toLowerCase());
 }
 }
 } else {
 for (const c of masterclassShelf) enrolledSubjectSlugs.add(c.subject.toLowerCase());
 }

 let programAccess: ProgramAccess = {
 private: true,
 masterclass: true,
 library: true,
 ucat: true,
 };

 if (profile.role === "student" || profile.role === "unverified") {
 const hasPair = privateAssignments.length > 0;
 const hasPrivateTier = enrolDetails.some((e) => {
 const t = e.tier || "masterclass";
 return t === "private_1on1" || t === "both";
 });
 const hasMasterclassProgram = enrolDetails.some((e) => {
 if (isUcatSubject(e.subject)) return false;
 const t = e.tier || "masterclass";
 return t === "masterclass" || t === "both";
 });
 const hasUcat =
 enrolDetails.some((e) => isUcatSubject(e.subject)) ||
 privateAssignments.some((p) => isUcatSubject(p.subject)) ||
 (profile.subjects || []).some((s) => isUcatSubject(s));
 const hasLibraryProgram = hasPair || hasPrivateTier || hasMasterclassProgram;

 programAccess = {
 private: !pendingAccess && (hasPair || hasPrivateTier),
 masterclass: !pendingAccess && hasMasterclassProgram,
 library: !pendingAccess && hasLibraryProgram,
 ucat: !pendingAccess && hasUcat,
 };
 }

 return (
 <>
 <p className="section-kicker">Dashboard</p>
 <h1 className="section-title">Your portal</h1>
 <p className="muted dash-lead">
 {pendingAccess
 ? "Progress tools are open now: Sylly-Map and ATAR. Private, Masterclass, Resource Library, and UCAT unlock once you’re enrolled."
 : "Private and Masterclass for programs. Resource Library for mocks and retrieval. Progress for Sylly-Map and ATAR."}
 </p>

 <DashboardTabs
 role={profile.role}
 programAccess={programAccess}
 masterclassClasses={masterclassClasses}
 libraryClasses={libraryClasses}
 ucatClasses={ucatClasses}
 enrolledSubjectSlugs={[...enrolledSubjectSlugs]}
 masterclassSessions={masterclassSessions}
 ucatSessions={ucatSessions}
 privateAssignments={privateAssignments}
 privateFiles={privateFiles}
 tutorStudents={
 profile.role === "student" || profile.role === "unverified" ? [] : tutorSessionStudents
 }
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
