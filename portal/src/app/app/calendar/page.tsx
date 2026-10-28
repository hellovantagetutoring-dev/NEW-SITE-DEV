import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { RescheduleForm } from "./RescheduleForm";

export default async function CalendarPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const now = new Date().toISOString();

  let query = supabase
    .from("sessions")
    .select("id, title, type, starts_at, ends_at, location_or_link, class_id, student_id, tutor_id")
    .gte("ends_at", now)
    .order("starts_at", { ascending: true })
    .limit(40);

  if (profile.role === "student") {
    query = query.or(`student_id.eq.${profile.id},class_id.not.is.null`);
  } else if (profile.role === "tutor") {
    query = query.eq("tutor_id", profile.id);
  }

  const { data: sessions } = await query;

  // Students only see masterclass sessions for enrolled classes + their private sessions
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

  const { data: requests } =
    profile.role === "student"
      ? await supabase
          .from("reschedule_requests")
          .select("id, status, preferred_slots, created_at, session_id")
          .eq("student_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(10)
      : await supabase
          .from("reschedule_requests")
          .select("id, status, preferred_slots, created_at, session_id, student_id, note")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(20);

  return (
    <AppShell profile={profile} active="calendar">
      <p className="section-kicker">Schedule</p>
      <h1 className="section-title">Upcoming</h1>
      <p className="muted" style={{ marginBottom: "1.25rem" }}>
        Masterclasses and 1-on-1 sessions. New bookings still use your usual booking link; you can
        request a reschedule here.
      </p>

      <div style={{ display: "grid", gap: "0.75rem", marginBottom: "2rem" }}>
        {visible.map((s) => (
          <div key={s.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div>
                <span className="pill">{s.type}</span>
                <h2 style={{ margin: "0.45rem 0 0.2rem", fontSize: "1rem" }}>{s.title}</h2>
                <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
                  {new Date(s.starts_at).toLocaleString("en-AU", {
                    timeZone: "Australia/Brisbane",
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                  {s.location_or_link ? ` · ${s.location_or_link}` : ""}
                </p>
              </div>
              {profile.role === "student" && <RescheduleForm sessionId={s.id} />}
            </div>
          </div>
        ))}
        {!visible.length && <p className="muted">No upcoming sessions yet.</p>}
      </div>

      <h2 style={{ fontSize: "1.05rem" }}>Reschedule requests</h2>
      <div style={{ display: "grid", gap: "0.65rem", marginTop: "0.75rem" }}>
        {(requests || []).map((r) => (
          <div key={r.id} className="card" style={{ padding: "0.9rem 1rem" }}>
            <strong style={{ textTransform: "capitalize" }}>{r.status}</strong>
            <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.9rem" }}>
              {r.preferred_slots}
            </p>
          </div>
        ))}
        {!requests?.length && <p className="muted">No requests yet.</p>}
      </div>
    </AppShell>
  );
}
