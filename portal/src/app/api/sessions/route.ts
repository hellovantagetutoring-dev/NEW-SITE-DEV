import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (profile.role !== "tutor" && profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const type = String(body.type || "private") as "private" | "masterclass";
  const title = String(body.title || "").trim();
  const startsAt = String(body.startsAt || "");
  const endsAt = String(body.endsAt || "");
  const locationOrLink = String(body.locationOrLink || "").trim();
  const studentId = body.studentId ? String(body.studentId) : null;
  const tutorId = body.tutorId ? String(body.tutorId) : profile.id;
  const classId = body.classId ? String(body.classId) : null;

  if (!title || !startsAt || !endsAt) {
    return NextResponse.json({ error: "Title and times required" }, { status: 400 });
  }
  if (type === "private" && !studentId) {
    return NextResponse.json({ error: "Student required for private session" }, { status: 400 });
  }

  const supabase = await createClient();

  if (profile.role === "tutor") {
    if (type !== "private" || !studentId) {
      return NextResponse.json({ error: "Tutors can only create private sessions" }, { status: 403 });
    }
    const { data: link } = await supabase
      .from("private_assignments")
      .select("student_id")
      .eq("tutor_id", profile.id)
      .eq("student_id", studentId)
      .maybeSingle();
    if (!link) {
      return NextResponse.json({ error: "Student is not assigned to you" }, { status: 403 });
    }
  }

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      type,
      title,
      student_id: type === "private" ? studentId : null,
      tutor_id: tutorId,
      class_id: type === "masterclass" ? classId : null,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
      location_or_link: locationOrLink,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Session created", id: data.id });
}
