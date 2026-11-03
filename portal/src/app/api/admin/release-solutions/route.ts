import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const fileId = String(body.fileId || "").trim();
  if (!fileId) {
    return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
  }

  // Default true for backwards compatibility; false = unrelease
  const release = body.release !== false && body.unrelease !== true;

  const supabase = await createClient();
  const { error } = await supabase
    .from("resource_files")
    .update({ solutions_released_at: release ? new Date().toISOString() : null })
    .eq("id", fileId)
    .eq("kind", "solutions");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    released: release,
    message: release ? "Solutions released" : "Solutions unreleased",
  });
}
