import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || (profile.role !== "tutor" && profile.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const form = await request.formData();
    const studentId = String(form.get("studentId") || "");
    const title = String(form.get("title") || "").trim() || "Custom homework";
    const file = form.get("file") as File | null;
    if (!studentId || !file?.size) {
      return NextResponse.json({ error: "Student and PDF required" }, { status: 400 });
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
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

    const tutorId = profile.role === "admin" ? String(form.get("tutorId") || profile.id) : profile.id;
    const service = createServiceClient();
    const path = `private/${tutorId}/${studentId}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await service.storage
      .from("class-resources")
      .upload(path, buffer, { contentType: "application/pdf", upsert: false });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    const { error } = await service.from("private_pair_files").insert({
      tutor_id: tutorId,
      student_id: studentId,
      title,
      storage_path: path,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ message: "Custom homework uploaded" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const profile = await getProfile();
  if (!profile || (profile.role !== "tutor" && profile.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json();
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const service = createServiceClient();
  const { data: row } = await service
    .from("private_pair_files")
    .select("id, tutor_id, storage_path")
    .eq("id", id)
    .maybeSingle();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (profile.role === "tutor" && row.tutor_id !== profile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await service.storage.from("class-resources").remove([row.storage_path]);
  const { error } = await service.from("private_pair_files").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Deleted" });
}
