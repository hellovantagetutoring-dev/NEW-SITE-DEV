import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const id = String(body.id || "").trim();
  if (!id) return NextResponse.json({ error: "Missing class id" }, { status: 400 });

  const service = createServiceClient();
  const { data: klass, error: loadErr } = await service
    .from("classes")
    .select("id, name, subject, stream")
    .eq("id", id)
    .maybeSingle();

  if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 500 });
  if (!klass) return NextResponse.json({ error: "Class not found" }, { status: 404 });

  // Cascades enrolments, resource sets/files via FK on delete.
  const { error } = await service.from("classes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    message: `Deleted ${klass.name}`,
    id: klass.id,
  });
}
