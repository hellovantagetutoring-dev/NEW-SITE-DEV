import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { evaluateFileAccess } from "@/lib/permissions/load-access-context";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stampPdf } from "@/lib/watermark";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await context.params;
  const inline = new URL(request.url).searchParams.get("inline") === "1";
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (profile.role === "unverified") {
    return NextResponse.json({ error: "Enrolment pending" }, { status: 403 });
  }

  const service = createServiceClient();
  const { data: file } = await service
    .from("resource_files")
    .select("id, kind, category, storage_path, solutions_released_at, set_id")
    .eq("id", fileId)
    .maybeSingle();

  if (!file?.storage_path) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const { data: set } = await service
    .from("resource_sets")
    .select("class_id, title, code, section")
    .eq("id", file.set_id)
    .maybeSingle();
  if (!set) {
    return NextResponse.json({ error: "Set not found" }, { status: 404 });
  }

  const { data: klass } = await service
    .from("classes")
    .select("id, subject, stream")
    .eq("id", set.class_id)
    .maybeSingle();
  if (!klass) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  // Also require RLS visibility for non-admins (shared masterclass / enrolled)
  if (profile.role !== "admin") {
    const supabase = await createClient();
    const { data: visible } = await supabase
      .from("resource_files")
      .select("id")
      .eq("id", fileId)
      .maybeSingle();
    if (!visible && profile.role === "student") {
      // Students may still get manual unlock for a file in a shared library class
      const { count } = await service
        .from("resource_unlocks")
        .select("*", { count: "exact", head: true })
        .eq("student_id", profile.id)
        .eq("resource_id", fileId);
      if ((count || 0) === 0) {
        return NextResponse.json({ error: "File not found or access denied" }, { status: 404 });
      }
    }
  }

  const access = await evaluateFileAccess(
    profile,
    file,
    klass.subject,
    klass.stream,
    set.section
  );
  if (!access.canAccess) {
    return NextResponse.json(
      {
        error: "This resource is locked for your enrolment",
        reason: access.reason,
        upsellType: access.upsellType,
      },
      { status: 403 }
    );
  }

  const { data: blob, error } = await service.storage
    .from("class-resources")
    .download(file.storage_path);

  if (error || !blob) {
    return NextResponse.json(
      { error: error?.message || "Could not load file" },
      { status: 500 }
    );
  }

  const master = await blob.arrayBuffer();
  const subjectGuess = (klass.subject || set.title || "").toLowerCase();
  const coverTextColor =
    subjectGuess.includes("specialist") || subjectGuess.includes("physics")
      ? "white"
      : "dark";

  const { bytes, code } = await stampPdf({
    bytes: master,
    fullName: profile.full_name || profile.email,
    email: profile.email,
    coverTextColor,
  });

  await service.from("download_events").insert({
    code,
    profile_id: profile.id,
    file_id: file.id,
  });

  const filename = `Vantage-${set.code || "set"}-${file.kind}-${code}.pdf`;
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": inline
        ? `inline; filename="${filename}"`
        : `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
