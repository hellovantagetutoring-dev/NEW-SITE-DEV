import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const tutorEmail = String(body.tutorEmail || "").trim().toLowerCase();
  const studentEmail = String(body.studentEmail || "").trim().toLowerCase();
  const subject = String(body.subject || "").trim();
  const note = String(body.note || "").trim();
  if (!tutorEmail || !studentEmail) {
    return NextResponse.json({ error: "Tutor and student emails required" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: tutor } = await service
    .from("profiles")
    .select("id, role")
    .eq("email", tutorEmail)
    .maybeSingle();
  const { data: student } = await service
    .from("profiles")
    .select("id")
    .eq("email", studentEmail)
    .maybeSingle();

  if (!tutor) {
    return NextResponse.json(
      { error: "Tutor profile not found. Add them first (role Tutor) so they can sign in" },
      { status: 400 }
    );
  }
  if (!student) {
    return NextResponse.json(
      { error: "Student profile not found. Add them to a class first, or create their login email" },
      { status: 400 }
    );
  }

  if (tutor.role === "student") {
    await service.from("profiles").update({ role: "tutor" }).eq("id", tutor.id);
  }

  const { error } = await service.from("private_assignments").upsert({
    tutor_id: tutor.id,
    student_id: student.id,
    subject,
    note,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    message: `Linked ${studentEmail} ↔ ${tutorEmail} for private 1-on-1`,
  });
}
