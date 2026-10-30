import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function canMutateSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profile: { id: string; role: string },
  sessionId: string
) {
  const { data: session } = await supabase
    .from("sessions")
    .select("id, tutor_id, student_id, type")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return { ok: false as const, status: 404, error: "Not found" };
  if (profile.role === "admin") return { ok: true as const, session };
  if (profile.role === "tutor" && session.tutor_id === profile.id) {
    return { ok: true as const, session };
  }
  return { ok: false as const, status: 403, error: "Forbidden" };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { id } = await params;
  const supabase = await createClient();
  const access = await canMutateSession(supabase, profile, id);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const body = await request.json();
  const patch: Record<string, string> = {};
  if (body.title != null) patch.title = String(body.title).trim();
  if (body.locationOrLink != null) patch.location_or_link = String(body.locationOrLink).trim();
  if (body.startsAt) patch.starts_at = new Date(String(body.startsAt)).toISOString();
  if (body.endsAt) patch.ends_at = new Date(String(body.endsAt)).toISOString();

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await supabase.from("sessions").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Session updated" });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { id } = await params;
  const supabase = await createClient();
  const access = await canMutateSession(supabase, profile, id);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const { error } = await supabase.from("sessions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Session deleted" });
}
