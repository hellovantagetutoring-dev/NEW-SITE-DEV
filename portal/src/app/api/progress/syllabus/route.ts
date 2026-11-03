import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";

async function canViewStudent(viewerId: string, role: string, studentId: string) {
  if (viewerId === studentId || role === "admin") return true;
  if (role !== "tutor") return false;
  const service = createServiceClient();
  const { data } = await service
    .from("private_assignments")
    .select("student_id")
    .eq("tutor_id", viewerId)
    .eq("student_id", studentId)
    .maybeSingle();
  return !!data;
}

export async function GET(request: Request) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const subject = String(url.searchParams.get("subject") || "methods").toLowerCase();
  const studentId = String(url.searchParams.get("studentId") || profile.id);
  const statusFilter = url.searchParams.get("status");

  if (!(await canViewStudent(profile.id, profile.role, studentId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const service = createServiceClient();
  const client = profile.role === "admin" || profile.role === "tutor" ? service : supabase;

  const { data: topics, error } = await client
    .from("syllabus_topics")
    .select("id, subject, unit, topic_code, title, sort_key")
    .eq("subject", subject)
    .order("sort_key");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: progress } = await client
    .from("syllabus_progress")
    .select("topic_id, status, updated_at")
    .eq("student_id", studentId);

  const byTopic = new Map((progress || []).map((p) => [p.topic_id, p]));
  let rows = (topics || []).map((t) => ({
    ...t,
    status: byTopic.get(t.id)?.status || "okay",
    updated_at: byTopic.get(t.id)?.updated_at || null,
  }));
  if (statusFilter === "need_help" || statusFilter === "okay" || statusFilter === "mastered") {
    rows = rows.filter((r) => r.status === statusFilter);
  }

  const counts = {
    need_help: rows.filter((r) => r.status === "need_help").length,
    okay: 0,
    mastered: 0,
  };
  // recount from full set
  const all = (topics || []).map((t) => byTopic.get(t.id)?.status || "okay");
  counts.need_help = all.filter((s) => s === "need_help").length;
  counts.okay = all.filter((s) => s === "okay").length;
  counts.mastered = all.filter((s) => s === "mastered").length;

  return NextResponse.json({ topics: rows, counts, studentId, subject });
}

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const topicId = String(body.topicId || "");
  const status = String(body.status || "");
  const studentId = String(body.studentId || profile.id);
  if (!topicId || !["need_help", "okay", "mastered"].includes(status)) {
    return NextResponse.json({ error: "Invalid topic or status" }, { status: 400 });
  }
  if (!(await canViewStudent(profile.id, profile.role, studentId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // Students only update self; tutors/admins may update assigned students
  if (profile.role === "student" && studentId !== profile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = createServiceClient();
  const { error } = await service.from("syllabus_progress").upsert({
    student_id: studentId,
    topic_id: topicId,
    status,
    updated_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, status });
}
