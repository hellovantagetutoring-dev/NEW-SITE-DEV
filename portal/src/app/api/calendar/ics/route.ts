import { NextResponse } from "next/server";
import { sessionsToIcs } from "@/lib/ics";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { SessionRow } from "@/lib/types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  const service = createServiceClient();
  let profileId: string | null = null;
  let role: string | null = null;
  let name = "Vantage Tutoring";

  if (token) {
    const { data } = await service
      .from("profiles")
      .select("id, role, full_name, email")
      .eq("calendar_feed_token", token)
      .maybeSingle();
    if (!data) return new NextResponse("Invalid token", { status: 401 });
    profileId = data.id;
    role = data.role;
    name = `Vantage · ${data.full_name || data.email}`;
  } else {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new NextResponse("Sign in or provide token", { status: 401 });
    const { data } = await supabase
      .from("profiles")
      .select("id, role, full_name, email, calendar_feed_token")
      .eq("id", user.id)
      .maybeSingle();
    if (!data) return new NextResponse("Profile missing", { status: 401 });
    profileId = data.id;
    role = data.role;
    name = `Vantage · ${data.full_name || data.email}`;
    if (!data.calendar_feed_token) {
      await service.rpc("ensure_calendar_feed_token", { pid: data.id }).catch(async () => {
        const tok = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
        await service.from("profiles").update({ calendar_feed_token: tok }).eq("id", data.id);
      });
    }
  }

  const now = new Date();
  const horizon = new Date(now.getTime() + 180 * 86400000).toISOString();
  const from = new Date(now.getTime() - 14 * 86400000).toISOString();

  let query = service
    .from("sessions")
    .select("id, class_id, student_id, tutor_id, starts_at, ends_at, type, title, location_or_link")
    .gte("starts_at", from)
    .lte("starts_at", horizon)
    .order("starts_at", { ascending: true })
    .limit(500);

  if (role === "student") {
    query = query.or(`student_id.eq.${profileId},class_id.not.is.null`);
  } else if (role === "tutor") {
    query = query.eq("tutor_id", profileId!);
  }

  const { data: sessions } = await query;
  let visible = (sessions || []) as SessionRow[];

  if (role === "student" && profileId) {
    const { data: enrolments } = await service
      .from("enrolments")
      .select("class_id")
      .eq("profile_id", profileId);
    const classIds = new Set((enrolments || []).map((e) => e.class_id));
    visible = visible.filter(
      (s) =>
        s.student_id === profileId ||
        (s.type === "masterclass" && s.class_id && classIds.has(s.class_id))
    );
  }

  const ics = sessionsToIcs(visible, { calendarName: name });
  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="vantage.ics"',
      "Cache-Control": "private, max-age=300",
    },
  });
}
