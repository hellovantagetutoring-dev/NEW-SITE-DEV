import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const tutorId = String(body.tutorId || "");
  const studentId = String(body.studentId || "");
  if (!tutorId || !studentId) {
    return NextResponse.json({ error: "tutorId and studentId required" }, { status: 400 });
  }

  const service = createServiceClient();
  const { error } = await service
    .from("private_assignments")
    .delete()
    .eq("tutor_id", tutorId)
    .eq("student_id", studentId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: "Pair unlinked" });
}
