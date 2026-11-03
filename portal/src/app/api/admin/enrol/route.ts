import { NextResponse } from "next/server";
import { updateProfileAdmin } from "@/lib/admin-profile-update";
import { getProfile } from "@/lib/auth";
import { normalizeSubjects, normalizeYearLevel } from "@/lib/student-fields";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const fullName = String(body.fullName || "").trim();
  const classId = String(body.classId || "").trim();
  const role = body.role === "tutor" ? "tutor" : "student";
  if (!email || !fullName) {
    return NextResponse.json({ error: "Email and full name are required" }, { status: 400 });
  }

  const isStudent = role === "student";
  const year_level = isStudent ? normalizeYearLevel(body.yearLevel, body.yearLevelOther) : "";
  const subjects = isStudent ? normalizeSubjects(body.subjects, body.subjectsOther) : [];

  const service = createServiceClient();

  const { data: existing } = await service
    .from("profiles")
    .select("id, role")
    .eq("email", email)
    .maybeSingle();

  let userId = existing?.id as string | undefined;

  if (!userId) {
    const { data: created, error } = await service.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error || !created.user) {
      return NextResponse.json(
        { error: error?.message || "Could not create user placeholder" },
        { status: 500 }
      );
    }
    userId = created.user.id;
    const row = {
      id: userId,
      email,
      full_name: fullName,
      role,
      year_level,
      subjects,
    };
    let { error: upsertErr } = await service.from("profiles").upsert(row);
    if (upsertErr && /year_level|subjects|schema cache/i.test(upsertErr.message)) {
      const base = { id: row.id, email: row.email, full_name: row.full_name, role: row.role };
      ({ error: upsertErr } = await service.from("profiles").upsert(base));
    }
    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }
  } else {
    const nextRole = existing?.role === "admin" ? "admin" : role;
    const err = await updateProfileAdmin(service, userId, {
      full_name: fullName,
      role: nextRole,
      ...(nextRole === "student"
        ? { year_level, subjects }
        : { year_level: "", subjects: [] }),
    });
    if (err) return NextResponse.json({ error: err }, { status: 500 });
  }

  if (classId) {
    if (role === "tutor") {
      const { error: tutorErr } = await service
        .from("class_tutors")
        .upsert({ class_id: classId, profile_id: userId });
      if (tutorErr) return NextResponse.json({ error: tutorErr.message }, { status: 500 });
    } else {
      const tierRaw = String(body.tier || "masterclass");
      const tier =
        tierRaw === "private_1on1" || tierRaw === "both" || tierRaw === "masterclass"
          ? tierRaw
          : "masterclass";
      const enrolRow = { class_id: classId, profile_id: userId, tier };
      let { error: enrolErr } = await service.from("enrolments").upsert(enrolRow);
      if (enrolErr && /tier|schema cache/i.test(enrolErr.message)) {
        ({ error: enrolErr } = await service
          .from("enrolments")
          .upsert({ class_id: classId, profile_id: userId }));
      }
      if (enrolErr) return NextResponse.json({ error: enrolErr.message }, { status: 500 });
    }
    return NextResponse.json({ message: `Added ${email} to class` });
  }

  return NextResponse.json({
    message: `Authorised ${email} as ${role}${
      role === "student" ? " (Progress open; assign a class or Private pair for gated resources)" : ""
    }`,
  });
}
