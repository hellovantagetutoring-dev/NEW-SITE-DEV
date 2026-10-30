import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
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

  const supabase = await createClient();
  const { data: file } = await supabase
    .from("resource_files")
    .select("id, kind, storage_path, solutions_released_at, set_id")
    .eq("id", fileId)
    .maybeSingle();

  if (!file) {
    return NextResponse.json({ error: "File not found or access denied" }, { status: 404 });
  }

  if (
    file.kind === "solutions" &&
    !file.solutions_released_at &&
    profile.role === "student"
  ) {
    return NextResponse.json({ error: "Solutions not released" }, { status: 403 });
  }

  const { data: set } = await supabase
    .from("resource_sets")
    .select("class_id, title, code")
    .eq("id", file.set_id)
    .maybeSingle();

  if (!set) {
    return NextResponse.json({ error: "Set not found" }, { status: 404 });
  }

  const service = createServiceClient();
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
  const subjectGuess = (set.title || "").toLowerCase();
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
