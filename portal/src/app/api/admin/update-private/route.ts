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
  const newTutorId = String(body.newTutorId || tutorId);
  const newStudentId = String(body.newStudentId || studentId);
  const subject = String(body.subject || "").trim();
  const note = String(body.note || "").trim();

  if (!tutorId || !studentId || !newTutorId || !newStudentId) {
    return NextResponse.json({ error: "Tutor and student required" }, { status: 400 });
  }

  const service = createServiceClient();

  if (newTutorId !== tutorId || newStudentId !== studentId) {
    await service.from("private_assignments").delete().eq("tutor_id", tutorId).eq("student_id", studentId);
  }

  const { data: tutor } = await service.from("profiles").select("id, role").eq("id", newTutorId).maybeSingle();
  if (!tutor) return NextResponse.json({ error: "Tutor not found" }, { status: 400 });
  if (tutor.role === "student") {
    await service.from("profiles").update({ role: "tutor" }).eq("id", tutor.id);
  }

  const { error } = await service.from("private_assignments").upsert({
    tutor_id: newTutorId,
    student_id: newStudentId,
    subject,
    note,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: "Pair updated" });
}
