import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import {
 categoryFromFile,
 type AccessResult,
 type ResourceCategory,
} from "@/lib/permissions/resource-access";
import {
 evaluateFileAccess,
 getSubjectTierForUser,
} from "@/lib/permissions/load-access-context";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ClassWorkspace } from "./ClassWorkspace";

export default async function ClassPage({
 params,
}: {
 params: Promise<{ id: string }>;
}) {
 const { id } = await params;
 const profile = await getProfile();
 if (!profile) redirect("/login");
 if (profile.role === "unverified") redirect("/not-enrolled");

 const supabase = await createClient();
 const { data: klass } = await supabase
 .from("classes")
 .select("id, name, subject, unit_band, year_label, stream")
 .eq("id", id)
 .maybeSingle();
 if (!klass) notFound();

 const { tier: subjectTier } = await getSubjectTierForUser(profile, klass.subject);

 const { data: sets } = await supabase
 .from("resource_sets")
 .select("id, code, title, section, release_at, sort_key, cover_path")
 .eq("class_id", id)
 .order("sort_key", { ascending: true });

 const setIds = (sets || []).map((s) => s.id);
 let filesRaw: {
 id: string;
 set_id: string;
 kind: string;
 category?: string | null;
 solutions_released_at: string | null;
 video_url?: string | null;
 }[] = [];
 if (setIds.length) {
 const withCategory = await supabase
 .from("resource_files")
 .select("id, set_id, kind, category, solutions_released_at, video_url")
 .in("set_id", setIds);
 if (withCategory.error) {
 const fallback = await supabase
 .from("resource_files")
 .select("id, set_id, kind, solutions_released_at")
 .in("set_id", setIds);
 filesRaw = fallback.data || [];
 } else {
 filesRaw = withCategory.data || [];
 }
 }

 const files = await Promise.all(
 (filesRaw || []).map(async (f) => {
 const access: AccessResult = await evaluateFileAccess(
 profile,
 f,
 klass.subject,
 klass.stream
 );
 const category: ResourceCategory = categoryFromFile({
 category: f.category,
 kind: f.kind,
 classStream: klass.stream,
 });
 return {
 id: f.id,
 set_id: f.set_id,
 kind: f.kind,
 category,
 solutions_released_at: f.solutions_released_at,
 // Never send storage paths: downloads go through /api/download
 canAccess: access.canAccess,
 accessReason: access.reason,
 upsellType: access.upsellType,
 // video only when accessible
 videoUrl: access.canAccess ? f.video_url || null : null,
 };
 })
 );

 const newestId = [...(sets || [])].sort((a, b) => {
 const ta = a.release_at ? new Date(a.release_at).getTime() : 0;
 const tb = b.release_at ? new Date(b.release_at).getTime() : 0;
 return tb - ta;
 })[0]?.id;

 // Tutors/admins: students they can unlock solutions for (assigned pairs matching subject)
 let unlockStudents: { id: string; label: string }[] = [];
 if (profile.role === "tutor" || profile.role === "admin") {
 const service = createServiceClient();
 const q = service
 .from("private_assignments")
 .select("student_id, subject, student:profiles!student_id (id, full_name, email)");
 const { data: pairs } =
 profile.role === "admin"
 ? await q
 : await q.eq("tutor_id", profile.id);

 unlockStudents = (pairs || [])
 .filter((p) => {
 const sub = (p.subject || "").toLowerCase();
 return !sub || sub.includes(klass.subject.toLowerCase());
 })
 .map((p) => {
 const student = Array.isArray(p.student) ? p.student[0] : p.student;
 return {
 id: p.student_id,
 label: student?.full_name || student?.email || "Student",
 };
 });
 }

 const unlockedForStudents: Record<string, string[]> = {};
 if (unlockStudents.length) {
 const service = createServiceClient();
 const solutionIds = files
 .filter((f) => f.kind === "solutions" || f.category === "mc_solution")
 .map((f) => f.id);
 if (solutionIds.length) {
 const { data: unlocks } = await service
 .from("resource_unlocks")
 .select("student_id, resource_id")
 .in(
 "student_id",
 unlockStudents.map((s) => s.id)
 )
 .in("resource_id", solutionIds);
 for (const u of unlocks || []) {
 unlockedForStudents[u.student_id] = [
 ...(unlockedForStudents[u.student_id] || []),
 u.resource_id,
 ];
 }
 }
 }

 return (
 <ClassWorkspace
 classId={klass.id}
 className={klass.name}
 subject={klass.subject}
 unitBand={klass.unit_band || ""}
 yearLabel={klass.year_label || ""}
 subjectTier={subjectTier}
 sets={sets || []}
 files={files}
 newestId={newestId}
 canRelease={profile.role === "admin"}
 canUnlock={profile.role === "tutor" || profile.role === "admin"}
 unlockStudents={unlockStudents}
 unlockedForStudents={unlockedForStudents}
 viewerRole={profile.role}
 />
 );
}
