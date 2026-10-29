import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { CalendarApp } from "./CalendarApp";

export default async function CalendarPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const rangeStart = new Date();
  rangeStart.setMonth(rangeStart.getMonth() - 1);
  const rangeEnd = new Date();
  rangeEnd.setMonth(rangeEnd.getMonth() + 5);

  let query = supabase
    .from("sessions")
    .select("id, title, type, starts_at, ends_at, location_or_link, class_id, student_id, tutor_id")
    .gte("starts_at", rangeStart.toISOString())
    .lte("starts_at", rangeEnd.toISOString())
    .order("starts_at", { ascending: true })
    .limit(500);

  if (profile.role === "student") {
    query = query.or(`student_id.eq.${profile.id},class_id.not.is.null`);
  } else if (profile.role === "tutor") {
    query = query.eq("tutor_id", profile.id);
  }

  const { data: sessions } = await query;

  let visible = sessions || [];
  if (profile.role === "student") {
    const { data: enrolments } = await supabase
      .from("enrolments")
      .select("class_id")
      .eq("profile_id", profile.id);
    const classIds = new Set((enrolments || []).map((e) => e.class_id));
    visible = visible.filter(
      (s) =>
        s.student_id === profile.id ||
        (s.type === "masterclass" && s.class_id && classIds.has(s.class_id))
    );
  }

  const pairSelect =
    "tutor_id, student_id, subject, tutor:profiles!tutor_id(full_name, email), student:profiles!student_id(full_name, email)";
  const { data: pairsRaw } =
    profile.role === "admin"
      ? await supabase.from("private_assignments").select(pairSelect)
      : profile.role === "tutor"
        ? await supabase.from("private_assignments").select(pairSelect).eq("tutor_id", profile.id)
        : await supabase.from("private_assignments").select(pairSelect).eq("student_id", profile.id);

  const pairs = (pairsRaw || []).map((p) => {
    const tutor = Array.isArray(p.tutor) ? p.tutor[0] : p.tutor;
    const student = Array.isArray(p.student) ? p.student[0] : p.student;
    return {
      tutor_id: p.tutor_id,
      student_id: p.student_id,
      subject: p.subject || "",
      tutorLabel: tutor?.full_name || tutor?.email || "Tutor",
      studentLabel: student?.full_name || student?.email || "Student",
    };
  });

  const { data: classes } =
    profile.role === "admin"
      ? await supabase.from("classes").select("id, name").order("name")
      : { data: [] as { id: string; name: string }[] };

  const { data: requests } = await supabase
    .from("reschedule_requests")
    .select(
      "id, status, session_id, preferred_slots, proposed_starts, proposed_duration_minutes, note, requested_by, student_id, created_at"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(40);

  const sessionTitles = new Map(visible.map((s) => [s.id, s.title]));
  // Also fetch titles for requests whose sessions may be outside range
  const missingIds = (requests || [])
    .map((r) => r.session_id)
    .filter((id) => !sessionTitles.has(id));
  if (missingIds.length) {
    const { data: extra } = await supabase.from("sessions").select("id, title").in("id", missingIds);
    for (const s of extra || []) sessionTitles.set(s.id, s.title);
  }

  const enrichedRequests = (requests || []).map((r) => ({
    ...r,
    proposed_starts: r.proposed_starts || [],
    session_title: sessionTitles.get(r.session_id),
  }));

  const service = createServiceClient();
  let token = "";
  const { data: tokRow } = await service
    .from("profiles")
    .select("calendar_feed_token")
    .eq("id", profile.id)
    .maybeSingle();
  token = tokRow?.calendar_feed_token || "";
  if (!token) {
    token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
    await service.from("profiles").update({ calendar_feed_token: token }).eq("id", profile.id);
  }

  const site =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://learn.vantagetutoring.com.au");
  const feedUrl = `${site.replace(/\/$/, "")}/api/calendar/ics?token=${token}`;

  return (
    <>
      <p className="section-kicker">Schedule</p>
      <h1 className="section-title">Calendar</h1>
      <p className="muted" style={{ marginBottom: "1.15rem" }}>
        Month and week views in Brisbane time. Generate a QLD term for a tutoring pair, request changes
        with real times, and subscribe in Google/Apple Calendar.
      </p>
      <CalendarApp
        role={profile.role}
        profileId={profile.id}
        sessions={visible}
        pairs={pairs}
        classes={classes || []}
        requests={enrichedRequests}
        feedUrl={feedUrl}
      />
    </>
  );
}
