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
  if (!profile) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const supabase = await createClient();
  const { data: file } = await supabase
    .from("private_pair_files")
    .select("id, title, storage_path, tutor_id, student_id")
    .eq("id", fileId)
    .maybeSingle();
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed =
    profile.role === "admin" ||
    file.tutor_id === profile.id ||
    file.student_id === profile.id;
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const service = createServiceClient();
  const { data: blob, error } = await service.storage
    .from("class-resources")
    .download(file.storage_path);
  if (error || !blob) {
    return NextResponse.json({ error: error?.message || "Could not load file" }, { status: 500 });
  }

  const master = await blob.arrayBuffer();
  const { bytes, code } = await stampPdf({
    bytes: master,
    fullName: profile.full_name || profile.email,
    email: profile.email,
    coverTextColor: "dark",
  });

  const filename = `Vantage-private-${code}.pdf`;
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": inline
        ? `inline; filename="${filename}"`
        : `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
