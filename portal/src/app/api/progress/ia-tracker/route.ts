import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const studentId = new URL(request.url).searchParams.get("studentId") || profile.id;
  if (profile.role === "student" && studentId !== profile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("ia_trackers")
    .select("*")
    .eq("student_id", studentId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trackers: data || [] });
}

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const subject = String(body.subject || "").toLowerCase();
  if (!subject) return NextResponse.json({ error: "Subject required" }, { status: 400 });

  const studentId =
    profile.role === "student" ? profile.id : String(body.studentId || profile.id);
  if (profile.role === "student" && studentId !== profile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const row = {
    student_id: studentId,
    subject,
    ia1_score: body.ia1Score == null || body.ia1Score === "" ? null : Number(body.ia1Score),
    ia1_max: Number(body.ia1Max ?? 20),
    ia2_score: body.ia2Score == null || body.ia2Score === "" ? null : Number(body.ia2Score),
    ia2_max: Number(body.ia2Max ?? 20),
    ia3_score: body.ia3Score == null || body.ia3Score === "" ? null : Number(body.ia3Score),
    ia3_max: Number(body.ia3Max ?? 20),
    target_raw: Number(body.targetRaw ?? 90),
    updated_at: new Date().toISOString(),
  };

  const service = createServiceClient();
  const { error } = await service.from("ia_trackers").upsert(row, { onConflict: "student_id,subject" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Tracker saved", tracker: row });
}
