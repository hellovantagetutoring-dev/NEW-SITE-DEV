"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getQldWeekInfo, overlayKindForDay, QLD_TERMS } from "@/lib/qld-school-calendar";

export type CalSession = {
  id: string;
  title: string;
  type: "masterclass" | "private";
  starts_at: string;
  ends_at: string;
  location_or_link: string;
  student_id: string | null;
  tutor_id: string | null;
  class_id: string | null;
};

export type CalPair = {
  tutor_id: string;
  student_id: string;
  subject: string;
  tutorLabel: string;
  studentLabel: string;
};

export type CalRequest = {
  id: string;
  status: string;
  session_id: string;
  preferred_slots: string;
  proposed_starts: string[] | null;
  proposed_duration_minutes: number;
  note: string;
  requested_by: string | null;
  student_id: string;
  created_at: string;
  session_title?: string;
};

type ClassOpt = { id: string; name: string };

const TZ = "Australia/Brisbane";

function ymdInBrisbane(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function startOfWeekMonday(d: Date): Date {
  const ymd = ymdInBrisbane(d);
  const [y, m, day] = ymd.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, day));
  const dow = utc.getUTCDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  utc.setUTCDate(utc.getUTCDate() + diff);
  return utc;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-AU", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDayLabel(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-AU", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function toDatetimeLocalValue(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function fromDatetimeLocal(value: string): string {
  // Treat as Brisbane local
  const [date, time] = value.split("T");
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h - 10, mi || 0)).toISOString();
}

export function CalendarApp({
  role,
  profileId,
  sessions,
  pairs,
  classes,
  requests,
  feedUrl,
}: {
  role: string;
  profileId: string;
  sessions: CalSession[];
  pairs: CalPair[];
  classes: ClassOpt[];
  requests: CalRequest[];
  feedUrl: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [view, setView] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [rescheduleFor, setRescheduleFor] = useState<string | null>(null);

  const canEdit = role === "admin" || role === "tutor";

  const selected = sessions.find((s) => s.id === selectedId) || null;

  const monthAnchor = useMemo(() => {
    const ymd = ymdInBrisbane(cursor);
    const [y, m] = ymd.split("-").map(Number);
    return { y, m, label: new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-AU", {
      timeZone: "UTC",
      month: "long",
      year: "numeric",
    }) };
  }, [cursor]);

  const weekDays = useMemo(() => {
    const start = startOfWeekMonday(cursor);
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(start, i);
      return formatYmdUtc(d);
    });
  }, [cursor]);

  const monthCells = useMemo(() => {
    const first = new Date(Date.UTC(monthAnchor.y, monthAnchor.m - 1, 1));
    const start = startOfWeekMonday(first);
    return Array.from({ length: 42 }, (_, i) => formatYmdUtc(addDays(start, i)));
  }, [monthAnchor]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalSession[]>();
    for (const s of sessions) {
      const key = ymdInBrisbane(new Date(s.starts_at));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    }
    return map;
  }, [sessions]);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function api(url: string, init?: RequestInit) {
    setMsg("");
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.error || "Something went wrong");
      return null;
    }
    setMsg(data.message || "Saved");
    refresh();
    return data;
  }

  async function deleteSession(id: string) {
    if (!confirm("Delete this session?")) return;
    await api(`/api/sessions/${id}`, { method: "DELETE" });
    setSelectedId(null);
  }

  function subscribeFeed() {
    const webcal = feedUrl.replace(/^https:/i, "webcal:").replace(/^http:/i, "webcal:");
    window.location.href = webcal;
    navigator.clipboard?.writeText(feedUrl).catch(() => {});
    setMsg("Opening calendar subscribe… if nothing opens, the link was copied");
  }

  const todayYmd = ymdInBrisbane(new Date());
  const pendingRequests = requests.filter((r) => r.status === "pending");

  const monthRows = useMemo(() => {
    const rows: string[][] = [];
    for (let i = 0; i < monthCells.length; i += 7) {
      rows.push(monthCells.slice(i, i + 7));
    }
    return rows;
  }, [monthCells]);

  const weekInfo = getQldWeekInfo(weekDays[0] || todayYmd);

  return (
    <div className="cal-app">
      <div className="cal-toolbar">
        <div className="tabs" role="tablist" aria-label="Calendar view">
          <button type="button" className="tab" data-active={view === "month"} onClick={() => setView("month")}>
            Month
          </button>
          <button type="button" className="tab" data-active={view === "week"} onClick={() => setView("week")}>
            Week
          </button>
        </div>
        <div className="cal-nav">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() =>
              setCursor((c) =>
                view === "month"
                  ? new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth() - 1, 1))
                  : addDays(c, -7)
              )
            }
          >
            Prev
          </button>
          <strong>{view === "month" ? monthAnchor.label : `Week of ${formatDayLabel(weekDays[0])}`}</strong>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() =>
              setCursor((c) =>
                view === "month"
                  ? new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth() + 1, 1))
                  : addDays(c, 7)
              )
            }
          >
            Next
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setCursor(new Date())}>
            Today
          </button>
        </div>
        <div className="cal-actions">
          <button type="button" className="btn btn-ghost" onClick={subscribeFeed}>
            Subscribe (iCal)
          </button>
          {canEdit && (
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setShowGenerate(true)}>
                Set recurring
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setShowAdd(true)}>
                Add session
              </button>
            </>
          )}
        </div>
      </div>

      {msg && <p className="cal-msg">{msg}{pending ? "…" : ""}</p>}

      <p className="muted cal-legend">
        QLD school weeks on the left. Shaded = holidays / public holidays. Red dot = today.
      </p>

      {view === "month" ? (
        <div className="cal-month">
          <div className="cal-dow cal-dow-with-gutter">
            <div className="cal-week-gutter-head" aria-hidden="true" />
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="cal-month-rows">
            {monthRows.map((row) => {
              const info = getQldWeekInfo(row[0]);
              return (
                <div key={row[0]} className="cal-month-row">
                  <div
                    className={`cal-week-gutter${info.kind === "holiday" || info.kind === "public_holiday" ? " is-hols" : ""}`}
                    title={info.label}
                  >
                    <span>{info.shortLabel || "—"}</span>
                  </div>
                  <div className="cal-grid-row">
                    {row.map((ymd) => {
                      const kind = overlayKindForDay(ymd);
                      const inMonth = ymd.startsWith(
                        `${monthAnchor.y}-${String(monthAnchor.m).padStart(2, "0")}`
                      );
                      const daySessions = byDay.get(ymd) || [];
                      const isToday = ymd === todayYmd;
                      return (
                        <div
                          key={ymd}
                          className={`cal-cell${!inMonth ? " is-out" : ""}${kind !== "term" && kind !== "none" ? " is-closed" : ""}${isToday ? " is-today" : ""}`}
                          data-kind={kind}
                        >
                          <div className="cal-cell-day">
                            {isToday && <span className="cal-today-dot" aria-hidden="true" />}
                            {Number(ymd.slice(-2))}
                          </div>
                          <div className="cal-cell-events">
                            {daySessions.slice(0, 3).map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                className={`cal-chip cal-chip-${s.type}`}
                                onClick={() => setSelectedId(s.id)}
                              >
                                {formatTime(s.starts_at)} {s.title}
                              </button>
                            ))}
                            {daySessions.length > 3 && (
                              <span className="muted" style={{ fontSize: "0.72rem" }}>
                                +{daySessions.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="cal-week-wrap">
          {weekInfo.label && (
            <div
              className={`cal-week-banner${weekInfo.kind === "holiday" || weekInfo.kind === "public_holiday" ? " is-hols" : ""}`}
            >
              {weekInfo.label}
            </div>
          )}
          <div className="cal-week">
            {weekDays.map((ymd) => {
              const kind = overlayKindForDay(ymd);
              const daySessions = byDay.get(ymd) || [];
              const isToday = ymd === todayYmd;
              return (
                <div
                  key={ymd}
                  className={`cal-week-col${kind !== "term" && kind !== "none" ? " is-closed" : ""}${isToday ? " is-today" : ""}`}
                  data-kind={kind}
                >
                  <div className="cal-week-head">
                    {isToday && <span className="cal-today-dot" aria-hidden="true" />}
                    {formatDayLabel(ymd)}
                  </div>
                  <div className="cal-week-body">
                    {daySessions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={`cal-chip cal-chip-${s.type}`}
                        onClick={() => setSelectedId(s.id)}
                      >
                        <strong>{formatTime(s.starts_at)}</strong>
                        <span>{s.title}</span>
                      </button>
                    ))}
                    {!daySessions.length && (
                      <p className="muted" style={{ fontSize: "0.82rem" }}>
                        No sessions
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selected && (
        <div className="cal-detail card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <span className="pill">{selected.type}</span>
              <h2 style={{ margin: "0.45rem 0 0.2rem", fontSize: "1.1rem" }}>{selected.title}</h2>
              <p className="muted" style={{ margin: 0 }}>
                {new Date(selected.starts_at).toLocaleString("en-AU", {
                  timeZone: TZ,
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
                {" – "}
                {formatTime(selected.ends_at)}
                {selected.location_or_link ? ` · ${selected.location_or_link}` : ""}
              </p>
            </div>
            <button type="button" className="btn btn-ghost" onClick={() => setSelectedId(null)}>
              Close
            </button>
          </div>
          <div className="cal-detail-actions">
            <a
              className="btn btn-ghost"
              href={`data:text/calendar;charset=utf-8,${encodeURIComponent(singleEventIcs(selected))}`}
              download={`${selected.title.replace(/\s+/g, "-")}.ics`}
            >
              Add to Calendar
            </a>
            {(role === "student" || role === "tutor" || role === "admin") &&
              (selected.student_id === profileId ||
                selected.tutor_id === profileId ||
                role === "admin") && (
                <button type="button" className="btn btn-ghost" onClick={() => setRescheduleFor(selected.id)}>
                  Request change
                </button>
              )}
            {canEdit && (role === "admin" || selected.tutor_id === profileId) && (
              <>
                <EditSessionForm
                  session={selected}
                  onSave={async (patch) => {
                    await api(`/api/sessions/${selected.id}`, {
                      method: "PATCH",
                      body: JSON.stringify(patch),
                    });
                  }}
                />
                <button type="button" className="btn btn-ghost" onClick={() => deleteSession(selected.id)}>
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {pendingRequests.length > 0 && (
        <section style={{ marginTop: "1.5rem" }}>
          <h2 style={{ fontSize: "1.05rem" }}>Change requests</h2>
          <div style={{ display: "grid", gap: "0.65rem", marginTop: "0.75rem" }}>
            {pendingRequests.map((r) => {
              const isRequester = r.requested_by === profileId;
              const canDecide = !isRequester || role === "admin";
              return (
                <div key={r.id} className="card" style={{ padding: "0.9rem 1rem" }}>
                  <strong>{r.session_title || "Session"}</strong>
                  <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.9rem" }}>
                    Proposed:{" "}
                    {(r.proposed_starts || []).length
                      ? (r.proposed_starts || [])
                          .map((iso) =>
                            new Date(iso).toLocaleString("en-AU", {
                              timeZone: TZ,
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              hour: "numeric",
                              minute: "2-digit",
                            })
                          )
                          .join(" · ")
                      : r.preferred_slots}
                  </p>
                  {r.note && (
                    <p className="muted" style={{ margin: "0.25rem 0 0", fontSize: "0.85rem" }}>
                      Note: {r.note}
                    </p>
                  )}
                  {canDecide && (
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.65rem" }}>
                      {(r.proposed_starts || []).map((iso) => (
                        <button
                          key={iso}
                          type="button"
                          className="btn btn-primary"
                          onClick={() =>
                            api(`/api/reschedule/${r.id}`, {
                              method: "PATCH",
                              body: JSON.stringify({ action: "approve", acceptedStart: iso }),
                            })
                          }
                        >
                          Accept {formatTime(iso)}
                        </button>
                      ))}
                      {!(r.proposed_starts || []).length && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() =>
                            api(`/api/reschedule/${r.id}`, {
                              method: "PATCH",
                              body: JSON.stringify({ action: "approve" }),
                            })
                          }
                        >
                          Approve
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() =>
                          api(`/api/reschedule/${r.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ action: "decline" }),
                          })
                        }
                      >
                        Decline
                      </button>
                    </div>
                  )}
                  {isRequester && !canDecide && (
                    <p className="muted" style={{ margin: "0.5rem 0 0", fontSize: "0.85rem" }}>
                      Waiting for the other party…
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {showAdd && canEdit && (
        <Modal title="Add session" onClose={() => setShowAdd(false)}>
          <AddSessionForm
            role={role}
            profileId={profileId}
            pairs={pairs}
            classes={classes}
            onSubmit={async (payload) => {
              const data = await api("/api/sessions", { method: "POST", body: JSON.stringify(payload) });
              if (data) setShowAdd(false);
            }}
          />
        </Modal>
      )}

      {showGenerate && canEdit && (
        <Modal title="Set recurring pair schedule" onClose={() => setShowGenerate(false)}>
          <GenerateTermForm
            role={role}
            profileId={profileId}
            pairs={pairs}
            classes={classes}
            onDone={(message) => {
              setMsg(message);
              setShowGenerate(false);
              refresh();
            }}
          />
        </Modal>
      )}

      {rescheduleFor && (
        <Modal title="Request change" onClose={() => setRescheduleFor(null)}>
          <RescheduleProposeForm
            session={sessions.find((s) => s.id === rescheduleFor)!}
            onSubmit={async (payload) => {
              const data = await api("/api/reschedule", {
                method: "POST",
                body: JSON.stringify({ sessionId: rescheduleFor, ...payload }),
              });
              if (data) {
                setRescheduleFor(null);
                setSelectedId(null);
              }
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function formatYmdUtc(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function singleEventIcs(s: CalSession): string {
  const uid = `${s.id}@learn.vantagetutoring.com.au`;
  const fmt = (iso: string) =>
    new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTART:${fmt(s.starts_at)}`,
    `DTEND:${fmt(s.ends_at)}`,
    `SUMMARY:${s.title}`,
    s.location_or_link ? `LOCATION:${s.location_or_link}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="cal-modal-backdrop" role="dialog" aria-modal="true">
      <div className="cal-modal card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "0.75rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>{title}</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AddSessionForm({
  role,
  profileId,
  pairs,
  classes,
  onSubmit,
}: {
  role: string;
  profileId: string;
  pairs: CalPair[];
  classes: ClassOpt[];
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const tutorPairs = role === "admin" ? pairs : pairs.filter((p) => p.tutor_id === profileId);
  return (
    <form
      className="cal-form"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const type = String(fd.get("type") || "private");
        const pairKey = String(fd.get("pairKey") || "");
        const pair = tutorPairs.find((p) => `${p.tutor_id}:${p.student_id}` === pairKey);
        const startsLocal = String(fd.get("startsAt") || "");
        const duration = Number(fd.get("duration") || 60);
        const startsAt = fromDatetimeLocal(startsLocal);
        const endsAt = new Date(new Date(startsAt).getTime() + duration * 60_000).toISOString();
        onSubmit({
          type,
          title: fd.get("title"),
          studentId: type === "private" ? pair?.student_id || null : null,
          tutorId: type === "private" ? pair?.tutor_id || profileId : profileId,
          classId: type === "masterclass" ? fd.get("classId") : null,
          startsAt,
          endsAt,
          locationOrLink: fd.get("locationOrLink"),
        });
      }}
    >
      {role === "admin" && (
        <label className="field">
          Type
          <select name="type" defaultValue="private">
            <option value="private">Private 1-on-1</option>
            <option value="masterclass">Masterclass</option>
          </select>
        </label>
      )}
      <label className="field">
        Title
        <input name="title" required placeholder="Methods tutoring" />
      </label>
      <label className="field">
        Tutoring pair
        <select name="pairKey">
          <option value="">Select…</option>
          {tutorPairs.map((p) => (
            <option key={`${p.tutor_id}-${p.student_id}`} value={`${p.tutor_id}:${p.student_id}`}>
              {p.studentLabel} ↔ {p.tutorLabel}
              {p.subject ? ` (${p.subject})` : ""}
            </option>
          ))}
        </select>
      </label>
      {role === "admin" && (
        <label className="field">
          Class (masterclass)
          <select name="classId">
            <option value="">—</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="field">
        Starts
        <input name="startsAt" type="datetime-local" required />
      </label>
      <label className="field">
        Duration (minutes)
        <input name="duration" type="number" min={15} step={15} defaultValue={60} />
      </label>
      <label className="field">
        Location / link
        <input name="locationOrLink" placeholder="Zoom / SLQ" />
      </label>
      <button className="btn btn-primary" type="submit">
        Create
      </button>
    </form>
  );
}

function GenerateTermForm({
  role,
  profileId,
  pairs,
  classes,
  onDone,
}: {
  role: string;
  profileId: string;
  pairs: CalPair[];
  classes: ClassOpt[];
  onDone: (message: string) => void;
}) {
  const [preview, setPreview] = useState<{ count: number; skipped: { date: string; reason: string }[] } | null>(
    null
  );
  const [err, setErr] = useState("");
  const tutorPairs = role === "admin" ? pairs : pairs.filter((p) => p.tutor_id === profileId);

  async function run(previewOnly: boolean, form: HTMLFormElement) {
    setErr("");
    const fd = new FormData(form);
    const type = String(fd.get("type") || "private");
    const pairKey = String(fd.get("pairKey") || "");
    const pair = tutorPairs.find((p) => `${p.tutor_id}:${p.student_id}` === pairKey);
    const res = await fetch("/api/sessions/generate-term", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        previewOnly,
        termId: fd.get("termId"),
        weekday: Number(fd.get("weekday")),
        time: fd.get("time"),
        durationMinutes: Number(fd.get("duration")),
        title: fd.get("title"),
        locationOrLink: fd.get("locationOrLink"),
        type,
        studentId: type === "private" ? pair?.student_id || null : null,
        tutorId: type === "private" ? pair?.tutor_id || profileId : profileId,
        classId: type === "masterclass" ? fd.get("classId") : null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.error || "Failed");
      return;
    }
    if (previewOnly) setPreview({ count: data.count, skipped: data.skipped || [] });
    else onDone(data.message || `Created ${data.created} sessions`);
  }

  return (
    <form
      className="cal-form"
      onSubmit={(e) => {
        e.preventDefault();
        run(false, e.currentTarget);
      }}
    >
      <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
        Saves a weekly recurring time for this tutoring pair, then fills the selected QLD term
        (holiday dates skipped). Run again for another term to keep using the same recurrence.
      </p>
      {role === "admin" && (
        <label className="field">
          Type
          <select name="type" defaultValue="private">
            <option value="private">Private pair</option>
            <option value="masterclass">Masterclass</option>
          </select>
        </label>
      )}
      <label className="field">
        Fill QLD term
        <select name="termId" required defaultValue={QLD_TERMS.find((t) => t.id.startsWith("2026"))?.id || QLD_TERMS[0]?.id}>
          {QLD_TERMS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Tutoring pair
        <select name="pairKey" required>
          <option value="">Select…</option>
          {tutorPairs.map((p) => (
            <option key={`${p.tutor_id}-${p.student_id}`} value={`${p.tutor_id}:${p.student_id}`}>
              {p.studentLabel} ↔ {p.tutorLabel}
              {p.subject ? ` · ${p.subject}` : ""}
            </option>
          ))}
        </select>
      </label>
      {role === "admin" && (
        <label className="field">
          Class (if masterclass)
          <select name="classId">
            <option value="">—</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="field">
        Weekday
        <select name="weekday" defaultValue="4">
          <option value="1">Monday</option>
          <option value="2">Tuesday</option>
          <option value="3">Wednesday</option>
          <option value="4">Thursday</option>
          <option value="5">Friday</option>
          <option value="6">Saturday</option>
          <option value="0">Sunday</option>
        </select>
      </label>
      <label className="field">
        Time (Brisbane)
        <input name="time" type="time" required defaultValue="16:00" />
      </label>
      <label className="field">
        Duration (minutes)
        <input name="duration" type="number" min={15} step={15} defaultValue={60} />
      </label>
      <label className="field">
        Title
        <input name="title" required placeholder="Weekly Methods" />
      </label>
      <label className="field">
        Location / link
        <input name="locationOrLink" placeholder="Zoom / SLQ" />
      </label>
      {err && <p style={{ color: "crimson", margin: 0 }}>{err}</p>}
      {preview && (
        <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
          Will save the weekly recurrence and create <strong>{preview.count}</strong> sessions
          {preview.skipped.length ? ` (skipping ${preview.skipped.length} holiday dates)` : ""}.
        </p>
      )}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={(e) => run(true, (e.currentTarget as HTMLButtonElement).form!)}
        >
          Preview
        </button>
        <button className="btn btn-primary" type="submit">
          Save recurring + fill term
        </button>
      </div>
    </form>
  );
}

function RescheduleProposeForm({
  session,
  onSubmit,
}: {
  session: CalSession;
  onSubmit: (payload: { proposedStarts: string[]; durationMinutes: number; note: string }) => Promise<void>;
}) {
  const duration = Math.max(
    15,
    Math.round((new Date(session.ends_at).getTime() - new Date(session.starts_at).getTime()) / 60_000)
  );
  return (
    <form
      className="cal-form"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const slots = [fd.get("slot1"), fd.get("slot2"), fd.get("slot3")]
          .map((v) => String(v || "").trim())
          .filter(Boolean)
          .map(fromDatetimeLocal);
        onSubmit({
          proposedStarts: slots,
          durationMinutes: Number(fd.get("duration") || duration),
          note: String(fd.get("note") || ""),
        });
      }}
    >
      <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
        Propose one to three concrete times (Brisbane). The other party can accept one and the session
        moves automatically.
      </p>
      <label className="field">
        Option 1
        <input name="slot1" type="datetime-local" required defaultValue={toDatetimeLocalValue(session.starts_at)} />
      </label>
      <label className="field">
        Option 2 (optional)
        <input name="slot2" type="datetime-local" />
      </label>
      <label className="field">
        Option 3 (optional)
        <input name="slot3" type="datetime-local" />
      </label>
      <label className="field">
        Duration (minutes)
        <input name="duration" type="number" min={15} step={15} defaultValue={duration} />
      </label>
      <label className="field">
        Note
        <input name="note" placeholder="Clash with exam block…" />
      </label>
      <button className="btn btn-primary" type="submit">
        Send request
      </button>
    </form>
  );
}

function EditSessionForm({
  session,
  onSave,
}: {
  session: CalSession;
  onSave: (patch: Record<string, string>) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)}>
        Edit
      </button>
    );
  }
  return (
    <form
      className="cal-form"
      style={{ width: "100%" }}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const startsAt = fromDatetimeLocal(String(fd.get("startsAt")));
        const duration = Number(fd.get("duration") || 60);
        const endsAt = new Date(new Date(startsAt).getTime() + duration * 60_000).toISOString();
        onSave({
          title: String(fd.get("title")),
          locationOrLink: String(fd.get("locationOrLink")),
          startsAt,
          endsAt,
        }).then(() => setOpen(false));
      }}
    >
      <label className="field">
        Title
        <input name="title" defaultValue={session.title} required />
      </label>
      <label className="field">
        Starts
        <input name="startsAt" type="datetime-local" required defaultValue={toDatetimeLocalValue(session.starts_at)} />
      </label>
      <label className="field">
        Duration
        <input
          name="duration"
          type="number"
          min={15}
          step={15}
          defaultValue={Math.round(
            (new Date(session.ends_at).getTime() - new Date(session.starts_at).getTime()) / 60_000
          )}
        />
      </label>
      <label className="field">
        Location / link
        <input name="locationOrLink" defaultValue={session.location_or_link} />
      </label>
      <button className="btn btn-primary" type="submit">
        Save
      </button>
    </form>
  );
}
