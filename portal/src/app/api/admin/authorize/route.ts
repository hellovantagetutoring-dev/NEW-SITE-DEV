import { NextResponse } from "next/server";
import { updateProfileAdmin } from "@/lib/admin-profile-update";
import { getProfile } from "@/lib/auth";
import { normalizeSubjects, normalizeYearLevel } from "@/lib/student-fields";
import { createServiceClient } from "@/lib/supabase/server";

const ALLOWED = new Set(["student", "tutor", "admin"]);

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const id = String(body.id || "").trim();
  const role = String(body.role || "").trim();
  const fullName = String(body.fullName ?? "").trim();
  const classId = String(body.classId || "").trim();

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (!ALLOWED.has(role)) {
    return NextResponse.json({ error: "Choose student, tutor, or admin" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: existing, error: loadErr } = await service
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", id)
    .maybeSingle();

  if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "Person not found" }, { status: 404 });

  let orphanStudent = false;
  if (existing.role === "student") {
    const [enrolRes, privateRes] = await Promise.all([
      service.from("enrolments").select("*", { count: "exact", head: true }).eq("profile_id", id),
      service
        .from("private_assignments")
        .select("*", { count: "exact", head: true })
        .eq("student_id", id),
    ]);
    orphanStudent = (enrolRes.count || 0) === 0 && (privateRes.count || 0) === 0;
  }

  if (existing.role !== "unverified" && !orphanStudent) {
    return NextResponse.json(
      { error: "Only unauthorised sign-ups can be enrolled here" },
      { status: 400 }
    );
  }

  const isStudent = role === "student";
  const err = await updateProfileAdmin(service, id, {
    role,
    full_name: fullName || existing.full_name || existing.email.split("@")[0],
    ...(isStudent
      ? {
          year_level: normalizeYearLevel(body.yearLevel, body.yearLevelOther),
          subjects: normalizeSubjects(body.subjects, body.subjectsOther),
        }
      : { year_level: "", subjects: [] }),
  });

  if (err) return NextResponse.json({ error: err }, { status: 500 });

  if (isStudent && classId) {
    const tierRaw = String(body.tier || "masterclass");
    const tier =
      tierRaw === "private_1on1" || tierRaw === "both" || tierRaw === "masterclass"
        ? tierRaw
        : "masterclass";
    const enrolRow = { class_id: classId, profile_id: id, tier };
    let { error: enrolErr } = await service
      .from("enrolments")
      .upsert(enrolRow, { onConflict: "profile_id,class_id" });
    if (enrolErr && /tier|schema cache/i.test(enrolErr.message)) {
      ({ error: enrolErr } = await service
        .from("enrolments")
        .upsert(
          { class_id: classId, profile_id: id },
          { onConflict: "profile_id,class_id" }
        ));
    }
    if (enrolErr) return NextResponse.json({ error: enrolErr.message }, { status: 500 });
  }

  if (role === "tutor" && classId) {
    const { error: tutorErr } = await service
      .from("class_tutors")
      .upsert({ class_id: classId, profile_id: id });
    if (tutorErr) return NextResponse.json({ error: tutorErr.message }, { status: 500 });
  }

  const label = role.charAt(0).toUpperCase() + role.slice(1);
  const accessNote =
    isStudent && classId
      ? " and added to the class library"
      : isStudent
        ? " (Progress tools open; add a class or Private pair for gated resources)"
        : "";
  return NextResponse.json({
    message: `Enrolled ${existing.email} as ${label}${accessNote}`,
  });
}
