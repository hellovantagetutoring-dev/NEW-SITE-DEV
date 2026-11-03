import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

/** Toggle manual unlock of a resource (typically mc_solution) for an assigned student. */
export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || (profile.role !== "tutor" && profile.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const studentId = String(body.studentId || "").trim();
  const resourceId = String(body.resourceId || "").trim();
  const unlock = body.unlock !== false;

  if (!studentId || !resourceId) {
    return NextResponse.json({ error: "Missing studentId or resourceId" }, { status: 400 });
  }

  const service = createServiceClient();

  if (profile.role === "tutor") {
    const { count } = await service
      .from("private_assignments")
      .select("*", { count: "exact", head: true })
      .eq("tutor_id", profile.id)
      .eq("student_id", studentId);
    if ((count || 0) === 0) {
      return NextResponse.json({ error: "Student is not assigned to you" }, { status: 403 });
    }
  }

  const { data: file } = await service
    .from("resource_files")
    .select("id, kind, category")
    .eq("id", resourceId)
    .maybeSingle();
  if (!file) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

  const isSolution =
    file.kind === "solutions" || file.category === "mc_solution";
  if (!isSolution && profile.role !== "admin") {
    return NextResponse.json(
      { error: "Tutors can only unlock worked solutions" },
      { status: 400 }
    );
  }

  if (unlock) {
    const { error } = await service.from("resource_unlocks").upsert(
      {
        student_id: studentId,
        resource_id: resourceId,
        unlocked_by: profile.id,
        unlocked_at: new Date().toISOString(),
      },
      { onConflict: "student_id,resource_id" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: "Worked solutions released to student", unlocked: true });
  }

  const { error } = await service
    .from("resource_unlocks")
    .delete()
    .eq("student_id", studentId)
    .eq("resource_id", resourceId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Unlock revoked", unlocked: false });
}
