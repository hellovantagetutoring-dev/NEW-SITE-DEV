import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await request.json();
  const sessionId = String(body.sessionId || "");
  const preferredSlots = String(body.preferredSlots || "").trim();
  const note = String(body.note || "").trim();
  if (!sessionId || !preferredSlots) {
    return NextResponse.json({ error: "Preferred times required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("id, title, starts_at")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const { error } = await supabase.from("reschedule_requests").insert({
    session_id: sessionId,
    student_id: profile.id,
    preferred_slots: preferredSlots,
    note,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const endpoint = process.env.FORMSPREE_ENDPOINT || "https://formspree.io/f/xnjenyao";
  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        form_type: "Portal reschedule request",
        _subject: `Reschedule: ${profile.full_name} · ${session.title}`,
        student_name: profile.full_name,
        email: profile.email,
        session: session.title,
        session_starts: session.starts_at,
        preferred_slots: preferredSlots,
        note,
      }),
    });
  } catch {
    /* request still saved in DB */
  }

  return NextResponse.json({ ok: true });
}
