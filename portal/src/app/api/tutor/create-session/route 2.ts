import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || (profile.role !== "tutor" && profile.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const studentId = String(body.studentId || "");
  const title = String(body.title || "").trim();
  const startsAt = String(body.startsAt || "");
  const endsAt = String(body.endsAt || "");
  const locationOrLink = String(body.locationOrLink || "").trim();

  if (!studentId || !title || !startsAt || !endsAt) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = await createClient();

  if (profile.role === "tutor") {
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

  const { error } = await supabase.from("sessions").insert({
    type: "private",
    title,
    student_id: studentId,
    tutor_id: profile.id,
    starts_at: new Date(startsAt).toISOString(),
    ends_at: new Date(endsAt).toISOString(),
    location_or_link: locationOrLink,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Session created" });
}
