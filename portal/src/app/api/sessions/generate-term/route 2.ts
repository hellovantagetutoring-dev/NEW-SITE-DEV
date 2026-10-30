import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { brisbaneLocalToUtcIso, listTermWeekdayDates } from "@/lib/qld-school-calendar";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (profile.role !== "tutor" && profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const termId = String(body.termId || "");
  const weekday = Number(body.weekday);
  const time = String(body.time || "16:00");
  const durationMinutes = Math.max(15, Number(body.durationMinutes) || 60);
  const title = String(body.title || "").trim();
  const locationOrLink = String(body.locationOrLink || "").trim();
  const type = String(body.type || "private") as "private" | "masterclass";
  const studentId = body.studentId ? String(body.studentId) : null;
  const tutorId = body.tutorId ? String(body.tutorId) : profile.id;
  const classId = body.classId ? String(body.classId) : null;
  const previewOnly = Boolean(body.previewOnly);
  const skipExisting = body.skipExisting !== false;

  if (!termId || Number.isNaN(weekday) || weekday < 0 || weekday > 6 || !title) {
    return NextResponse.json({ error: "termId, weekday, and title required" }, { status: 400 });
  }
  if (type === "private" && !studentId) {
    return NextResponse.json({ error: "studentId required for private" }, { status: 400 });
  }
  if (type === "masterclass" && profile.role !== "admin") {
    return NextResponse.json({ error: "Only admin can generate masterclass terms" }, { status: 403 });
  }

  const supabase = await createClient();

  if (profile.role === "tutor" && studentId) {
    const { data: link } = await supabase
      .from("private_assignments")
      .select("student_id")
      .eq("tutor_id", profile.id)
      .eq("student_id", studentId)
      .maybeSingle();
    if (!link) {
      return NextResponse.json({ error: "Student is not assigned to you" }, { status: 403 });
    }
  }

  const { dates, skipped } = listTermWeekdayDates(termId, weekday);
  const planned = dates.map((ymd) => {
    const startsAt = brisbaneLocalToUtcIso(ymd, time);
    const endsAt = new Date(
      new Date(startsAt).getTime() + durationMinutes * 60_000
    ).toISOString();
    return { ymd, startsAt, endsAt };
  });

  if (previewOnly) {
    return NextResponse.json({
      count: planned.length,
      planned,
      skipped,
      recurring: {
        weekday,
        time,
        durationMinutes,
        title,
      },
    });
  }

  // Upsert the pair/class recurring weekly rule
  let seriesId: string | null = null;
  let seriesQuery = supabase
    .from("session_series")
    .select("id")
    .eq("type", type)
    .eq("active", true)
    .eq("weekday", weekday);

  if (type === "private" && studentId) {
    seriesQuery = seriesQuery.eq("tutor_id", tutorId).eq("student_id", studentId);
  } else if (classId) {
    seriesQuery = seriesQuery.eq("class_id", classId);
  }

  const { data: existingSeries } = await seriesQuery.maybeSingle();

  if (existingSeries?.id) {
    seriesId = existingSeries.id;
    const { error: upErr } = await supabase
      .from("session_series")
      .update({
        title,
        weekday,
        time_local: time,
        duration_minutes: durationMinutes,
        location_or_link: locationOrLink,
        tutor_id: tutorId,
        student_id: type === "private" ? studentId : null,
        class_id: type === "masterclass" ? classId : null,
        active: true,
      })
      .eq("id", seriesId);
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
  } else {
    const { data: created, error: cErr } = await supabase
      .from("session_series")
      .insert({
        type,
        title,
        weekday,
        time_local: time,
        duration_minutes: durationMinutes,
        location_or_link: locationOrLink,
        tutor_id: tutorId,
        student_id: type === "private" ? studentId : null,
        class_id: type === "masterclass" ? classId : null,
        active: true,
      })
      .select("id")
      .single();
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
    seriesId = created.id;
  }

  let toInsert = planned;
  if (skipExisting && planned.length) {
    const rangeStart = planned[0].startsAt;
    const rangeEnd = planned[planned.length - 1].endsAt;
    let q = supabase
      .from("sessions")
      .select("starts_at")
      .gte("starts_at", rangeStart)
      .lte("starts_at", rangeEnd);
    if (type === "private" && studentId) {
      q = q.eq("student_id", studentId).eq("tutor_id", tutorId);
    } else if (classId) {
      q = q.eq("class_id", classId);
    }
    const { data: existing } = await q;
    const existingStarts = new Set((existing || []).map((s) => s.starts_at));
    toInsert = planned.filter((p) => !existingStarts.has(p.startsAt));
  }

  if (!toInsert.length) {
    return NextResponse.json({
      message:
        "Recurring schedule saved for this pair. No new sessions to create (already exist or skipped).",
      created: 0,
      seriesId,
      skipped,
    });
  }

  const rows = toInsert.map((p) => ({
    type,
    title,
    student_id: type === "private" ? studentId : null,
    tutor_id: tutorId,
    class_id: type === "masterclass" ? classId : null,
    starts_at: p.startsAt,
    ends_at: p.endsAt,
    location_or_link: locationOrLink,
    series_id: seriesId,
  }));

  const { error } = await supabase.from("sessions").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    message: `Saved weekly recurring schedule and created ${rows.length} sessions for the term`,
    created: rows.length,
    seriesId,
    skipped,
  });
}
