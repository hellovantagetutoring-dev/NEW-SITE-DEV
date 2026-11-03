import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { ISMG_CRITERIA } from "@/lib/qce-scoring";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const studentId = url.searchParams.get("studentId");
  const service = createServiceClient();

  let q = service
    .from("assessment_dropbox")
    .select(
      "id, student_id, tutor_id, subject, title, assessment_type, status, draft_path, task_sheet_path, ismg_path, feedback_path, tutor_note, criteria, created_at, updated_at"
    )
    .order("updated_at", { ascending: false })
    .limit(50);

  if (profile.role === "student") q = q.eq("student_id", profile.id);
  else if (profile.role === "tutor") {
    if (studentId) q = q.eq("student_id", studentId).eq("tutor_id", profile.id);
    else q = q.eq("tutor_id", profile.id);
  } else if (studentId) q = q.eq("student_id", studentId);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [], criteriaPresets: ISMG_CRITERIA });
}

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const form = await request.formData();
    const title = String(form.get("title") || "Assessment draft").trim();
    const subject = String(form.get("subject") || "").trim().toLowerCase();
    const assessmentType = String(form.get("assessmentType") || "psmt");
    const tutorId = String(form.get("tutorId") || "");
    const studentId =
      profile.role === "student" ? profile.id : String(form.get("studentId") || profile.id);

    if (profile.role === "student" && !tutorId) {
      return NextResponse.json({ error: "Select your tutor" }, { status: 400 });
    }

    const service = createServiceClient();
    let resolvedTutor = tutorId || profile.id;
    if (profile.role === "student") {
      const { data: link } = await service
        .from("private_assignments")
        .select("tutor_id")
        .eq("student_id", profile.id)
        .eq("tutor_id", tutorId)
        .maybeSingle();
      if (!link) return NextResponse.json({ error: "Not paired with that tutor" }, { status: 403 });
      resolvedTutor = tutorId;
    }

    async function upload(field: string) {
      const file = form.get(field) as File | null;
      if (!file?.size) return null;
      const path = `dropbox/${studentId}/${Date.now()}-${field}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error } = await service.storage
        .from("class-resources")
        .upload(path, buffer, { contentType: file.type || "application/octet-stream", upsert: false });
      if (error) throw new Error(error.message);
      return path;
    }

    const draft_path = await upload("draft");
    const task_sheet_path = await upload("taskSheet");
    const ismg_path = await upload("ismg");
    if (!draft_path) {
      return NextResponse.json({ error: "Draft file required" }, { status: 400 });
    }

    const criteriaKeys = ISMG_CRITERIA[assessmentType] || ISMG_CRITERIA.psmt;
    const criteria = Object.fromEntries(criteriaKeys.map((k) => [k, "pending"]));

    const { data, error } = await service
      .from("assessment_dropbox")
      .insert({
        student_id: studentId,
        tutor_id: resolvedTutor,
        subject,
        title,
        assessment_type: assessmentType,
        status: "with_tutor",
        draft_path,
        task_sheet_path,
        ismg_path,
        criteria,
      })
      .select("id")
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ message: "Draft submitted to your tutor", id: data?.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const profile = await getProfile();
  if (!profile || (profile.role !== "tutor" && profile.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const form = await request.formData();
    const id = String(form.get("id") || "");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const service = createServiceClient();
    const { data: row } = await service
      .from("assessment_dropbox")
      .select("id, tutor_id, student_id")
      .eq("id", id)
      .maybeSingle();
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (profile.role === "tutor" && row.tutor_id !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tutor_note = String(form.get("tutorNote") || "");
    const criteriaRaw = String(form.get("criteria") || "");
    let criteria = {};
    try {
      criteria = criteriaRaw ? JSON.parse(criteriaRaw) : {};
    } catch {
      criteria = {};
    }

    let feedback_path: string | null = null;
    const file = form.get("feedback") as File | null;
    if (file?.size) {
      const path = `dropbox/${row.student_id}/${Date.now()}-feedback-${file.name.replace(/[^\w.\-]+/g, "_")}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error: upErr } = await service.storage
        .from("class-resources")
        .upload(path, buffer, { contentType: file.type || "application/octet-stream", upsert: false });
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
      feedback_path = path;
    }

    const update: Record<string, unknown> = {
      tutor_note,
      criteria,
      status: "feedback_ready",
      updated_at: new Date().toISOString(),
    };
    if (feedback_path) update.feedback_path = feedback_path;

    const { error } = await service.from("assessment_dropbox").update(update).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: "Feedback returned to student" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 }
    );
  }
}
