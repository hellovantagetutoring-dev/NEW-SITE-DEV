import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const id = String(url.searchParams.get("id") || "");
  const kind = String(url.searchParams.get("kind") || "draft");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const service = createServiceClient();
  const { data: row } = await service
    .from("assessment_dropbox")
    .select("student_id, tutor_id, draft_path, task_sheet_path, ismg_path, feedback_path, title")
    .eq("id", id)
    .maybeSingle();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed =
    profile.role === "admin" ||
    profile.id === row.student_id ||
    profile.id === row.tutor_id;
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const path =
    kind === "task"
      ? row.task_sheet_path
      : kind === "ismg"
        ? row.ismg_path
        : kind === "feedback"
          ? row.feedback_path
          : row.draft_path;
  if (!path) return NextResponse.json({ error: "File not available" }, { status: 404 });

  const { data, error } = await service.storage.from("class-resources").download(path);
  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Download failed" }, { status: 500 });
  }

  const buf = Buffer.from(await data.arrayBuffer());
  const filename = path.split("/").pop() || `${row.title || "file"}.pdf`;
  return new NextResponse(buf, {
    headers: {
      "Content-Type": data.type || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
