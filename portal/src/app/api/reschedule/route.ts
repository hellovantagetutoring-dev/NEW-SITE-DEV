import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { sendPortalEmail } from "@/lib/notify";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await request.json();
  const sessionId = String(body.sessionId || "");
  const note = String(body.note || "").trim();
  const proposedStarts = Array.isArray(body.proposedStarts)
    ? body.proposedStarts.map((s: unknown) => new Date(String(s)).toISOString()).filter(Boolean)
    : [];
  const durationMinutes = Math.max(15, Number(body.durationMinutes) || 60);

  if (!sessionId || !proposedStarts.length) {
    return NextResponse.json({ error: "Pick at least one proposed time" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("id, title, starts_at, ends_at, student_id, tutor_id")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const isParty =
    profile.role === "admin" ||
    session.student_id === profile.id ||
    session.tutor_id === profile.id;
  if (!isParty) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const studentId = session.student_id || profile.id;

  const { data: inserted, error } = await supabase
    .from("reschedule_requests")
    .insert({
      session_id: sessionId,
      student_id: studentId,
      requested_by: profile.id,
      preferred_slots: proposedStarts
        .map((iso: string) =>
          new Date(iso).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" })
        )
        .join(" · "),
      proposed_starts: proposedStarts,
      proposed_duration_minutes: durationMinutes,
      note,
      status: "pending",
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const notifyIds = [session.tutor_id, session.student_id].filter(
    (id): id is string => !!id && id !== profile.id
  );
  if (session.tutor_id && !notifyIds.includes(session.tutor_id)) {
    // Always ensure tutor is notified when student proposes
    if (profile.id === session.student_id && session.tutor_id) notifyIds.push(session.tutor_id);
  }

  const { data: people } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", [...new Set(notifyIds)]);

  for (const person of people || []) {
    try {
      await sendPortalEmail({
        subject: `Change request: ${session.title}`,
        toEmail: person.email,
        fields: {
          form_type: "Portal reschedule request",
          requester: profile.full_name || profile.email,
          requester_email: profile.email,
          session: session.title,
          current_start: session.starts_at,
          proposed_starts: proposedStarts.join(", "),
          note,
          request_id: inserted.id,
        },
      });
    } catch {
      /* saved in DB */
    }
  }

  return NextResponse.json({ ok: true, id: inserted.id });
}
