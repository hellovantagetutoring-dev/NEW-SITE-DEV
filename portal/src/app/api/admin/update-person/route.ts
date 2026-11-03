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
  const id = String(body.id || "");
  const fullName = String(body.fullName ?? "").trim();
  const role = String(body.role || "").trim();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (!["student", "tutor", "admin", "unverified"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const service = createServiceClient();

  if (role !== "admin" && id === profile.id) {
    const { count } = await service
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count || 0) <= 1) {
      return NextResponse.json({ error: "Cannot demote the only admin" }, { status: 400 });
    }
  }

  const isStudent = role === "student";
  const err = await updateProfileAdmin(service, id, {
    full_name: fullName,
    role,
    ...(isStudent
      ? {
          year_level: normalizeYearLevel(body.yearLevel, body.yearLevelOther),
          subjects: normalizeSubjects(body.subjects, body.subjectsOther),
        }
      : { year_level: "", subjects: [] }),
  });

  if (err) return NextResponse.json({ error: err }, { status: 500 });

  return NextResponse.json({ message: "Person updated" });
}
