import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  let tutorId = String(body.tutorId || "").trim();
  let studentId = String(body.studentId || "").trim();
  const tutorEmail = String(body.tutorEmail || "").trim().toLowerCase();
  const studentEmail = String(body.studentEmail || "").trim().toLowerCase();
  const subject = String(body.subject || "").trim();
  const note = String(body.note || "").trim();

  const service = createServiceClient();

  if (!tutorId && tutorEmail) {
    const { data } = await service.from("profiles").select("id, role").eq("email", tutorEmail).maybeSingle();
    if (!data) {
      return NextResponse.json({ error: "Tutor profile not found" }, { status: 400 });
    }
    tutorId = data.id;
    if (data.role === "student") {
      await service.from("profiles").update({ role: "tutor" }).eq("id", data.id);
    }
  }
  if (!studentId && studentEmail) {
    const { data } = await service.from("profiles").select("id").eq("email", studentEmail).maybeSingle();
    if (!data) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 400 });
    }
    studentId = data.id;
  }

  if (!tutorId || !studentId) {
    return NextResponse.json({ error: "Tutor and student required" }, { status: 400 });
  }

  const { data: tutor } = await service.from("profiles").select("id, role, email").eq("id", tutorId).maybeSingle();
  const { data: student } = await service.from("profiles").select("id, email").eq("id", studentId).maybeSingle();
  if (!tutor || !student) {
    return NextResponse.json({ error: "Tutor or student not found" }, { status: 400 });
  }
  if (tutor.role === "student") {
    await service.from("profiles").update({ role: "tutor" }).eq("id", tutor.id);
  }

  const { error } = await service.from("private_assignments").upsert({
    tutor_id: tutorId,
    student_id: studentId,
    subject,
    note,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    message: `Linked ${student.email} ↔ ${tutor.email} for private 1-on-1`,
  });
}
