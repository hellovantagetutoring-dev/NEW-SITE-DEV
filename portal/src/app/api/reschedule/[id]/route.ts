import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { sendPortalEmail } from "@/lib/notify";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const action = String(body.action || "");
  const acceptedStart = body.acceptedStart ? new Date(String(body.acceptedStart)).toISOString() : null;

  const supabase = await createClient();
  const { data: req } = await supabase
    .from("reschedule_requests")
    .select(
      "id, status, session_id, student_id, requested_by, proposed_starts, proposed_duration_minutes, note"
    )
    .eq("id", id)
    .maybeSingle();
  if (!req) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (req.status !== "pending") {
    return NextResponse.json({ error: "Request already resolved" }, { status: 400 });
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("id, title, starts_at, ends_at, student_id, tutor_id")
    .eq("id", req.session_id)
    .maybeSingle();
  if (!session) return NextResponse.json({ error: "Session missing" }, { status: 404 });

  const isParty =
    profile.role === "admin" ||
    session.tutor_id === profile.id ||
    session.student_id === profile.id;
  if (!isParty) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Requester shouldn't accept their own request unless admin
  if (
    action === "approve" &&
    profile.role !== "admin" &&
    req.requested_by === profile.id
  ) {
    return NextResponse.json({ error: "Wait for the other party to accept" }, { status: 400 });
  }

  if (action === "decline") {
    await supabase.from("reschedule_requests").update({ status: "declined" }).eq("id", id);
  } else if (action === "approve") {
    const starts = acceptedStart || (req.proposed_starts || [])[0];
    if (!starts) return NextResponse.json({ error: "Pick a proposed time" }, { status: 400 });
    const duration = req.proposed_duration_minutes || 60;
    const ends = new Date(new Date(starts).getTime() + duration * 60_000).toISOString();

    const { error: sErr } = await supabase
      .from("sessions")
      .update({ starts_at: starts, ends_at: ends })
      .eq("id", session.id);
    if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

    await supabase
      .from("reschedule_requests")
      .update({ status: "approved", accepted_start: starts })
      .eq("id", id);
  } else {
    return NextResponse.json({ error: "action must be approve or decline" }, { status: 400 });
  }

  const notifyId =
    req.requested_by && req.requested_by !== profile.id
      ? req.requested_by
      : session.student_id === profile.id
        ? session.tutor_id
        : session.student_id;

  if (notifyId) {
    const { data: person } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", notifyId)
      .maybeSingle();
    if (person?.email) {
      try {
        await sendPortalEmail({
          subject: `Reschedule ${action}d: ${session.title}`,
          toEmail: person.email,
          fields: {
            form_type: "Portal reschedule decision",
            decision: action,
            session: session.title,
            decided_by: profile.full_name || profile.email,
            accepted_start: acceptedStart || "",
          },
        });
      } catch {
        /* ignore */
      }
    }
  }

  return NextResponse.json({ message: action === "approve" ? "Session moved" : "Request declined" });
}
